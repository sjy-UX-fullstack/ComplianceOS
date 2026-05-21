/**
 * ComplianceOS — Public Notice Endpoint
 * Sprint 2 Task 2.10: GET /api/v1/public/notice/{slug}/{lang}
 *
 * Serves published policy notices (privacy notice, cookie policy) as
 * public-facing HTML pages, renderable in any browser without authentication.
 */

import { NextRequest } from "next/server";
import { POLICY_TEMPLATES } from "@complianceos/db/policy-templates";

// Default tenant data for demo (in production, fetched from DB via slug lookup)
const DEMO_COMPANY_NAME = "Acme D2C Pvt Ltd";
const DEMO_VARIABLES: Record<string, string> = {
  companyName: DEMO_COMPANY_NAME,
  companyAddress: "4th Floor, Prestige Tech Park, Marathahalli, Bengaluru, Karnataka 560103",
  entityType: "Private Limited Company",
  cin: "U72200KA2024PTC123456",
  industry: "E-Commerce & Retail",
  websiteUrl: "https://acme-d2c.in",
  dpoName: "Rajesh Kumar",
  dpoEmail: "dpo@acme-d2c.in",
  dpoPhone: "+91 80 4567 8900",
  grievanceUrl: "https://acme-d2c.in/privacy",
  dataCategories: `
- **Identity Data:** Name, email address, phone number, Aadhaar (last 4 digits for verification)
- **Transaction Data:** Purchase history, payment details (tokenized), delivery addresses
- **Device Data:** IP address, browser type, device identifiers
- **Usage Data:** Pages visited, products viewed, search queries, session duration
- **Communication Data:** Customer support messages, feedback, reviews
`,
  purposes: `
1. **Order Fulfillment:** Processing and delivering your purchases
2. **Account Management:** Managing your user account and preferences
3. **Customer Support:** Responding to your queries and complaints
4. **Marketing Communications:** Sending promotional offers (with your consent)
5. **Analytics:** Understanding user behavior to improve our services
6. **Legal Compliance:** Compliance with tax, GST, and regulatory obligations
7. **Fraud Prevention:** Detecting and preventing fraudulent transactions
`,
  thirdPartyProcessors: `
- **AWS India (ap-south-1):** Cloud hosting and data storage
- **Razorpay:** Payment gateway (PCI-DSS compliant)
- **SendGrid:** Transactional email delivery
- **Freshdesk:** Customer support ticketing
- **Google Analytics:** Website analytics (with consent)
`,
  retentionPeriod: "3 years from last transaction or account activity",
  crossBorderCountries: "None — all data is processed and stored within India (AWS Mumbai / Hyderabad regions)",
  effectiveDate: "1 January 2026",
  lastUpdated: "21 May 2026",
  consentBannerUrl: "https://acme-d2c.in/banner-sdk.js",
};

function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    rendered = rendered.replace(regex, value || `[${key}]`);
  }
  rendered = rendered.replace(/\{\{(\w+)\}\}/g, "[$1]");
  return rendered;
}

function markdownToStyledHtml(md: string, title: string, companyName: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^---$/gm, "<hr/>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\| (.+) \|/g, (match) => {
      const cells = match.split("|").filter((c) => c.trim()).map((c) => `<td>${c.trim()}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${companyName} Privacy Notice — DPDP Act 2023 Compliant">
  <title>${title} — ${companyName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 24px;
      line-height: 1.75;
      background: #fafafa;
    }
    .notice-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #1e40af, #3b82f6);
      color: white;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    h1 { font-size: 32px; margin: 12px 0 8px; color: #0f172a; font-weight: 800; }
    h2 { font-size: 22px; margin: 36px 0 12px; color: #1e293b; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h3 { font-size: 17px; margin: 24px 0 8px; color: #334155; font-weight: 600; }
    p { margin: 8px 0; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; border-radius: 8px; overflow: hidden; }
    th, td { text-align: left; padding: 10px 14px; border: 1px solid #e2e8f0; font-size: 14px; }
    th { background: #f1f5f9; font-weight: 600; color: #334155; }
    tr:nth-child(even) { background: #f8fafc; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'JetBrains Mono', monospace; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
    li { margin-left: 24px; margin-bottom: 6px; font-size: 15px; }
    a { color: #1e40af; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 12px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    @media print {
      body { max-width: 100%; padding: 20px; background: white; }
    }
    @media (max-width: 640px) {
      body { padding: 20px 16px; }
      h1 { font-size: 24px; }
      table { font-size: 12px; }
    }
  </style>
</head>
<body>
  <div class="notice-badge">🛡️ DPDP Act 2023 Compliant</div>
  <p>${html}</p>
  <div class="footer">
    <span>Powered by <strong>ComplianceOS</strong> · India's DPDP Compliance Platform</span>
    <span>Data Residency: AWS Mumbai (ap-south-1) · All personal data stays in India 🇮🇳</span>
  </div>
</body>
</html>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; lang: string }> }
) {
  const { slug, lang } = await params;

  // Map slug to template type
  const slugMap: Record<string, string> = {
    "privacy-notice": "privacy_notice",
    "privacy": "privacy_notice",
    "cookie-policy": "cookie_policy",
    "cookies": "cookie_policy",
  };

  const templateType = slugMap[slug];
  if (!templateType) {
    return new Response(
      `<html><body><h1>404 — Notice Not Found</h1><p>Available: /privacy-notice, /cookie-policy</p></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  const language = lang || "en";
  const template = POLICY_TEMPLATES.find(
    (t) => t.type === templateType && t.language === language
  );

  if (!template) {
    // Fallback to English
    const fallback = POLICY_TEMPLATES.find(
      (t) => t.type === templateType && t.language === "en"
    );
    if (!fallback) {
      return new Response("<html><body><h1>Template not found</h1></body></html>", {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }
    const rendered = renderTemplate(fallback.templateBody, DEMO_VARIABLES);
    const html = markdownToStyledHtml(rendered, fallback.name, DEMO_COMPANY_NAME);
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const rendered = renderTemplate(template.templateBody, DEMO_VARIABLES);
  const html = markdownToStyledHtml(rendered, template.name, DEMO_COMPANY_NAME);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
