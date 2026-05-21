/**
 * ComplianceOS — GST Invoice Generator
 * Sprint 3 Task 3.4: India GST-compliant tax invoices (CGST/SGST/IGST split,
 * 18% rate on SaaS subscriptions).
 *
 * Indian GST rules applied:
 *   - SaaS classified under SAC 998314 (Information technology services)
 *   - Standard rate 18% (CGST 9% + SGST 9% intra-state, IGST 18% inter-state)
 *   - Place of Supply determines CGST/SGST vs IGST per IGST Act §10/12/13
 *   - GSTIN must be quoted on every B2B invoice
 *   - HSN/SAC, place of supply, reverse charge applicability are mandatory fields
 *
 * Reference: CBIC GST Invoice Rules — Notification 12/2017-Central Tax
 *
 * rule_ref: DPDP Rule 8 (retention) — invoices retained 8y per Income Tax Act §44AA
 */

import { GST_RATE } from "@complianceos/db/plans";

export interface InvoiceLineItem {
  sac: string; // SAC code (998314 for SaaS)
  description: string;
  quantity: number;
  unitPriceInr: number; // rupees, ex-GST
  amountInr: number; // rupees, ex-GST (qty × unit)
}

export interface InvoiceParty {
  legalName: string;
  gstin?: string;
  pan?: string;
  address: string;
  stateCode: string; // 2-digit GST state code
  email?: string;
}

export interface InvoicePayload {
  // Sequential, fiscal-year-scoped invoice number per Rule 46(b) CGST Rules
  number: string;
  issuedAt: Date;
  dueAt?: Date;

  seller: InvoiceParty;
  buyer: InvoiceParty;

  lineItems: InvoiceLineItem[];

  // Computed
  subtotalInr: number;
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
  totalTaxInr: number;
  totalInr: number;
  amountInWords: string;

  // Razorpay linkage
  razorpayInvoiceId?: string;
  razorpayPaymentId?: string;

  placeOfSupplyStateCode: string;
  reverseCharge: boolean;
  notes?: string;
}

// ─── Number generation (fiscal year scoped) ────────────────────────────────
// Indian FY runs Apr 1 → Mar 31. Format: CMPOS/2026-27/000123

export function fiscalYearLabel(d: Date = new Date()): string {
  const month = d.getMonth(); // 0-indexed; Apr = 3
  const year = d.getFullYear();
  const start = month >= 3 ? year : year - 1;
  const end = (start + 1).toString().slice(-2);
  return `${start}-${end}`;
}

export function buildInvoiceNumber(seq: number, d: Date = new Date()): string {
  const fy = fiscalYearLabel(d);
  return `CMPOS/${fy}/${seq.toString().padStart(6, "0")}`;
}

// ─── Tax split (intra-state vs inter-state) ────────────────────────────────

export function splitTax(
  taxableInr: number,
  sellerStateCode: string,
  buyerStateCode: string,
): { cgstInr: number; sgstInr: number; igstInr: number } {
  const totalTax = round2(taxableInr * GST_RATE);
  // Intra-state: CGST 9% + SGST 9%
  if (sellerStateCode === buyerStateCode) {
    const half = round2(totalTax / 2);
    return { cgstInr: half, sgstInr: totalTax - half, igstInr: 0 };
  }
  // Inter-state: IGST 18%
  return { cgstInr: 0, sgstInr: 0, igstInr: totalTax };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Number → Words (Indian numbering: lakh/crore) ─────────────────────────

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n] ?? "";
  const t = Math.floor(n / 10);
  const o = n % 10;
  return (TENS[t] ?? "") + (o ? " " + (ONES[o] ?? "") : "");
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (r) parts.push(twoDigits(r));
  return parts.join(" ");
}

export function amountInWords(rupees: number): string {
  const whole = Math.floor(rupees);
  const paise = Math.round((rupees - whole) * 100);

  if (whole === 0 && paise === 0) return "Zero Rupees Only";

  const crore = Math.floor(whole / 10_000_000);
  const lakh = Math.floor((whole % 10_000_000) / 100_000);
  const thousand = Math.floor((whole % 100_000) / 1000);
  const rest = whole % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));

  let result = parts.join(" ").trim() + " Rupees";
  if (paise) result += ` and ${twoDigits(paise)} Paise`;
  return result + " Only";
}

// ─── Builder ───────────────────────────────────────────────────────────────

export function buildInvoice(input: {
  number: string;
  issuedAt?: Date;
  dueAt?: Date;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  lineItems: Omit<InvoiceLineItem, "amountInr">[];
  razorpayInvoiceId?: string;
  razorpayPaymentId?: string;
  reverseCharge?: boolean;
  notes?: string;
}): InvoicePayload {
  const issuedAt = input.issuedAt ?? new Date();

  const computedLines: InvoiceLineItem[] = input.lineItems.map((li) => ({
    ...li,
    amountInr: round2(li.quantity * li.unitPriceInr),
  }));

  const subtotalInr = round2(
    computedLines.reduce((sum, li) => sum + li.amountInr, 0),
  );

  const { cgstInr, sgstInr, igstInr } = splitTax(
    subtotalInr,
    input.seller.stateCode,
    input.buyer.stateCode,
  );

  const totalTaxInr = round2(cgstInr + sgstInr + igstInr);
  const totalInr = round2(subtotalInr + totalTaxInr);

  return {
    number: input.number,
    issuedAt,
    dueAt: input.dueAt,
    seller: input.seller,
    buyer: input.buyer,
    lineItems: computedLines,
    subtotalInr,
    cgstInr,
    sgstInr,
    igstInr,
    totalTaxInr,
    totalInr,
    amountInWords: amountInWords(totalInr),
    razorpayInvoiceId: input.razorpayInvoiceId,
    razorpayPaymentId: input.razorpayPaymentId,
    placeOfSupplyStateCode: input.buyer.stateCode,
    reverseCharge: input.reverseCharge ?? false,
    notes: input.notes,
  };
}

// ─── HTML renderer (printable; PDF via headless Chrome in Sprint 5) ────────

export function renderInvoiceHtml(inv: InvoicePayload): string {
  const fmt = (n: number) =>
    n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const lineRows = inv.lineItems
    .map(
      (li, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(li.description)}</td>
        <td class="num">${escapeHtml(li.sac)}</td>
        <td class="num">${li.quantity}</td>
        <td class="num">₹ ${fmt(li.unitPriceInr)}</td>
        <td class="num">₹ ${fmt(li.amountInr)}</td>
      </tr>`,
    )
    .join("");

  const taxRows = inv.igstInr
    ? `<tr><td colspan="5">IGST @ 18%</td><td class="num">₹ ${fmt(inv.igstInr)}</td></tr>`
    : `<tr><td colspan="5">CGST @ 9%</td><td class="num">₹ ${fmt(inv.cgstInr)}</td></tr>
       <tr><td colspan="5">SGST @ 9%</td><td class="num">₹ ${fmt(inv.sgstInr)}</td></tr>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice ${escapeHtml(inv.number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font: 14px/1.5 "Inter", system-ui, sans-serif; color: #0f172a; padding: 32px; max-width: 800px; margin: 0 auto; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    .meta { color: #64748b; font-size: 12px; }
    .parties { display: flex; gap: 24px; margin: 24px 0; }
    .party { flex: 1; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; }
    .party h3 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    td.num, th.num { text-align: right; }
    tfoot td { font-weight: 600; }
    .total-row td { border-top: 2px solid #0f172a; padding-top: 12px; font-size: 16px; }
    .footer { margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 600; }
  </style>
</head>
<body>
  <header>
    <h1>Tax Invoice</h1>
    <div class="meta">
      <strong>${escapeHtml(inv.number)}</strong> · Issued ${fmtDate(inv.issuedAt)}
      ${inv.dueAt ? ` · Due ${fmtDate(inv.dueAt)}` : ""}
    </div>
    <div class="meta">Place of Supply: ${escapeHtml(inv.placeOfSupplyStateCode)} · Reverse Charge: ${inv.reverseCharge ? "Yes" : "No"}</div>
  </header>

  <section class="parties">
    <div class="party">
      <h3>From</h3>
      <strong>${escapeHtml(inv.seller.legalName)}</strong><br/>
      ${escapeHtml(inv.seller.address)}<br/>
      ${inv.seller.gstin ? `GSTIN: <code>${escapeHtml(inv.seller.gstin)}</code><br/>` : ""}
      ${inv.seller.pan ? `PAN: <code>${escapeHtml(inv.seller.pan)}</code>` : ""}
    </div>
    <div class="party">
      <h3>Bill To</h3>
      <strong>${escapeHtml(inv.buyer.legalName)}</strong><br/>
      ${escapeHtml(inv.buyer.address)}<br/>
      ${inv.buyer.gstin ? `GSTIN: <code>${escapeHtml(inv.buyer.gstin)}</code><br/>` : `<span class="badge">B2C</span><br/>`}
      ${inv.buyer.email ? escapeHtml(inv.buyer.email) : ""}
    </div>
  </section>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th class="num">SAC</th>
        <th class="num">Qty</th>
        <th class="num">Rate</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
    <tfoot>
      <tr><td colspan="5">Subtotal (ex-GST)</td><td class="num">₹ ${fmt(inv.subtotalInr)}</td></tr>
      ${taxRows}
      <tr class="total-row"><td colspan="5">Total</td><td class="num">₹ ${fmt(inv.totalInr)}</td></tr>
    </tfoot>
  </table>

  <p><strong>Amount in words:</strong> ${escapeHtml(inv.amountInWords)}</p>

  ${inv.razorpayPaymentId ? `<p class="meta">Razorpay Payment ID: <code>${escapeHtml(inv.razorpayPaymentId)}</code></p>` : ""}
  ${inv.notes ? `<p class="meta">${escapeHtml(inv.notes)}</p>` : ""}

  <footer class="footer">
    This is a computer-generated tax invoice issued under Rule 46 of the CGST Rules, 2017.
    Retained for 8 years per Income Tax Act §44AA. ComplianceOS does not require a physical signature.
  </footer>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
