/**
 * Sprint 3 Task 3.4 — Invoice generator endpoint (preview/render).
 *
 *   POST /api/v1/billing/invoices  → renders an invoice from payload
 *     body: { planCode, billingCycle, buyer, seq?, ... }
 *     ?format=json (default) | html
 *
 * In production, invoices are written to the `invoices` table on
 * `subscription.charged` webhook. This endpoint is the renderer used
 * by both the webhook handler and the admin preview UI.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  buildInvoice,
  buildInvoiceNumber,
  renderInvoiceHtml,
  type InvoiceParty,
} from "../../../../../lib/billing/gst-invoice";
import { getPlanByCode } from "@complianceos/db/plans";

export const runtime = "nodejs";

interface CreateInvoiceBody {
  planCode: string;
  billingCycle: "monthly" | "yearly";
  buyer: InvoiceParty;
  seq?: number; // override (defaults to time-based pseudo-seq for preview)
  razorpayPaymentId?: string;
  notes?: string;
}

function sellerFromEnv(): InvoiceParty {
  return {
    legalName:
      process.env.BILLING_LEGAL_ENTITY_NAME ??
      "ComplianceOS Technologies Pvt Ltd",
    gstin: process.env.BILLING_LEGAL_ENTITY_GSTIN,
    pan: process.env.BILLING_LEGAL_ENTITY_PAN,
    address:
      process.env.BILLING_LEGAL_ENTITY_ADDRESS ??
      "Bengaluru, Karnataka, India",
    stateCode: process.env.BILLING_LEGAL_ENTITY_STATE_CODE ?? "29",
    email: "billing@complianceos.in",
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: CreateInvoiceBody;
  try {
    body = (await req.json()) as CreateInvoiceBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = getPlanByCode(body.planCode);
  if (!plan) {
    return NextResponse.json(
      { error: `Unknown plan code: ${body.planCode}` },
      { status: 404 },
    );
  }
  if (plan.code === "free") {
    return NextResponse.json(
      { error: "Free tier has no invoice." },
      { status: 400 },
    );
  }

  const amountInr =
    body.billingCycle === "yearly" ? plan.yearlyPriceInr : plan.monthlyPriceInr;

  // Pseudo-seq for preview; real seq comes from DB sequence in production.
  const seq = body.seq ?? Math.floor(Date.now() / 1000) % 1_000_000;

  const invoice = buildInvoice({
    number: buildInvoiceNumber(seq),
    seller: sellerFromEnv(),
    buyer: body.buyer,
    lineItems: [
      {
        sac: "998314",
        description: `ComplianceOS ${plan.displayName} — ${body.billingCycle} subscription`,
        quantity: 1,
        unitPriceInr: amountInr,
      },
    ],
    razorpayPaymentId: body.razorpayPaymentId,
    notes: body.notes,
  });

  const format = req.nextUrl.searchParams.get("format") ?? "json";
  if (format === "html") {
    return new NextResponse(renderInvoiceHtml(invoice), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return NextResponse.json(invoice);
}
