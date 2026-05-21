/**
 * ComplianceOS — Assessment Export API
 * GET /api/v1/assessments/{id}/export?format=json|pdf
 *
 * Sprint 1 Task 1.5: PDF + JSON export of readiness assessment results.
 * Generates a detailed compliance report with scores, gaps, and 90-day plan.
 */

import { NextResponse, NextRequest } from "next/server";

// Mock assessment data (in production, this comes from DB via assessment ID)
// The frontend sends the full report payload as query params or fetches from DB
function getMockAssessmentReport(assessmentId: string) {
  return {
    meta: {
      assessmentId,
      tenantName: "Acme D2C Pvt Ltd",
      tenantId: "acme-d2c",
      industry: "e-commerce",
      entityType: "PvtLtd",
      generatedAt: new Date().toISOString(),
      generatedBy: "dpo@acme.in",
      complianceOsVersion: "1.0.0",
      frameworkVersion: "DPDP Act 2023 + Rules 2025",
    },
    overallScore: 42,
    categories: {
      consent: { score: 33, totalQuestions: 5, status: "non_compliant" },
      dsr: { score: 50, totalQuestions: 2, status: "warning" },
      breach: { score: 20, totalQuestions: 2, status: "non_compliant" },
      vendor: { score: 50, totalQuestions: 1, status: "warning" },
      security: { score: 60, totalQuestions: 1, status: "warning" },
      ropa: { score: 20, totalQuestions: 2, status: "non_compliant" },
      lms: { score: 40, totalQuestions: 1, status: "non_compliant" },
    },
    gaps: [
      {
        questionCode: "consent_notice_present",
        category: "consent",
        severity: "high",
        ruleRefs: ["Rule 3", "Section 5"],
        remediation:
          "Deploy DPDP-compliant privacy notice modals across all collection channels.",
      },
      {
        questionCode: "breach_notification_system",
        category: "breach",
        severity: "high",
        ruleRefs: ["Section 8(6)", "Rule 7", "CERT-In Directions"],
        remediation:
          "Deploy dual-clock incident alerting (6h CERT-In / 72h DPB).",
      },
      {
        questionCode: "ropa_records_maintained",
        category: "ropa",
        severity: "high",
        ruleRefs: ["Rule 8"],
        remediation: "Complete data inventory mapping in the RoPA module.",
      },
    ],
    plan: [
      {
        timeframe: "Days 1-30",
        title: "Implement Rule 3 Privacy Notice",
        actionRequired:
          "Deploy DPDP-compliant privacy notice modals across all web/mobile registration forms.",
        category: "consent",
        ruleRefs: ["Rule 3", "Section 5"],
      },
      {
        timeframe: "Days 1-30",
        title: "Implement Breach Response Playbook",
        actionRequired:
          "Configure breach wizard with dual-clock (6h/72h) and automated evidence lock.",
        category: "breach",
        ruleRefs: ["Section 8(6)", "Rule 7"],
      },
      {
        timeframe: "Days 31-60",
        title: "Deploy Data Principal Rights Portal",
        actionRequired:
          "Launch the ComplianceOS DSR public portal and link it in the privacy policy footer.",
        category: "dsr",
        ruleRefs: ["Section 11", "Section 12", "Section 13"],
      },
      {
        timeframe: "Days 31-60",
        title: "Execute standard DPDP DPAs",
        actionRequired:
          "Generate and sign DPDP-compliant DPAs with all third-party vendors.",
        category: "vendor",
        ruleRefs: ["Section 8(2)"],
      },
      {
        timeframe: "Days 61-90",
        title: "Scaffold Processing Registry (RoPA)",
        actionRequired:
          "Complete initial data inventory mapping in the RoPA module.",
        category: "ropa",
        ruleRefs: ["Rule 8"],
      },
      {
        timeframe: "Days 61-90",
        title: "Launch Employee DPDP LMS Training",
        actionRequired:
          "Enforce completion of the ComplianceOS baseline DPDP awareness training.",
        category: "lms",
        ruleRefs: ["Section 8(5)"],
      },
    ],
  };
}

function generatePdfHtml(report: ReturnType<typeof getMockAssessmentReport>) {
  const statusColor = (status: string) =>
    status === "compliant"
      ? "#10b981"
      : status === "warning"
        ? "#f59e0b"
        : "#ef4444";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>DPDP Readiness Assessment — ${report.meta.tenantName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; line-height: 1.6; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  h2 { font-size: 18px; margin: 32px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
  h3 { font-size: 15px; margin: 16px 0 8px; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
  .meta span { margin-right: 16px; }
  .score-box { text-align: center; background: linear-gradient(135deg, #1e40af, #3b82f6); color: #fff; border-radius: 12px; padding: 32px; margin: 24px 0; }
  .score-box .value { font-size: 64px; font-weight: 800; }
  .score-box .label { font-size: 14px; opacity: 0.85; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  th { background: #f1f5f9; font-weight: 700; }
  .severity-high { color: #ef4444; font-weight: 700; }
  .severity-medium { color: #f59e0b; font-weight: 700; }
  .severity-low { color: #06b6d4; font-weight: 700; }
  .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
  .timeline-badge { display: inline-block; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; text-align: center; }
  @media print {
    body { padding: 20px; }
    .score-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <div>
      <h1>🛡️ DPDP Readiness Assessment Report</h1>
      <div class="meta">
        <span><strong>Fiduciary:</strong> ${report.meta.tenantName}</span>
        <span><strong>Industry:</strong> ${report.meta.industry}</span>
        <span><strong>Date:</strong> ${new Date(report.meta.generatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
      </div>
    </div>
    <div style="font-size:12px;color:#64748b;text-align:right;">
      Generated by ComplianceOS v${report.meta.complianceOsVersion}<br/>
      Framework: ${report.meta.frameworkVersion}
    </div>
  </div>

  <div class="score-box">
    <div class="label">Overall DPDP Readiness Score</div>
    <div class="value">${report.overallScore}%</div>
    <div class="label">${report.overallScore >= 80 ? "Compliant — Maintain periodic reviews" : report.overallScore >= 50 ? "Partial Compliance — Remediation Required" : "Significant Gaps — Immediate Action Needed"}</div>
  </div>

  <h2>Category Breakdown</h2>
  <table>
    <thead>
      <tr><th>Category</th><th>Score</th><th>Questions</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${Object.entries(report.categories)
        .map(
          ([cat, data]) => `
        <tr>
          <td style="text-transform:capitalize;font-weight:600;">${cat}</td>
          <td><strong>${data.score}%</strong></td>
          <td>${data.totalQuestions}</td>
          <td>
            <span class="status-dot" style="background:${statusColor(data.status)};"></span>
            <span style="color:${statusColor(data.status)};text-transform:capitalize;">${data.status.replace("_", " ")}</span>
          </td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h2>Compliance Gaps Identified</h2>
  <table>
    <thead>
      <tr><th>Area</th><th>Category</th><th>Severity</th><th>Rule References</th><th>Remediation</th></tr>
    </thead>
    <tbody>
      ${report.gaps
        .map(
          (g) => `
        <tr>
          <td style="font-weight:600;">${g.questionCode.replace(/_/g, " ")}</td>
          <td style="text-transform:capitalize;">${g.category}</td>
          <td class="severity-${g.severity}">${g.severity.toUpperCase()}</td>
          <td style="font-size:12px;">${g.ruleRefs.join(", ")}</td>
          <td style="font-size:12px;">${g.remediation}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h2>90-Day Implementation Plan</h2>
  ${["Days 1-30", "Days 31-60", "Days 61-90"]
    .map((phase) => {
      const tasks = report.plan.filter((t) => t.timeframe === phase);
      if (!tasks.length) return "";
      return `
      <h3><span class="timeline-badge">${phase}</span> ${phase === "Days 1-30" ? "— Critical Priority" : phase === "Days 31-60" ? "— Medium Priority" : "— Hardening & Training"}</h3>
      <table>
        <thead><tr><th>Task</th><th>Category</th><th>Action Required</th><th>Rule Refs</th></tr></thead>
        <tbody>
          ${tasks
            .map(
              (t) => `
            <tr>
              <td style="font-weight:600;">${t.title}</td>
              <td style="text-transform:capitalize;">${t.category}</td>
              <td style="font-size:12px;">${t.actionRequired}</td>
              <td style="font-size:12px;">${t.ruleRefs.join(", ")}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
    })
    .join("")}

  <div class="footer">
    <p>ComplianceOS — India's DPDP Compliance Platform · Data Residency: AWS Mumbai (ap-south-1)</p>
    <p>This report is generated for internal compliance purposes only. Assessment ID: ${report.meta.assessmentId}</p>
    <p>© ${new Date().getFullYear()} ComplianceOS · All personal data stays in India 🇮🇳</p>
  </div>
</body>
</html>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const format =
    req.nextUrl.searchParams.get("format") || "json";

  const report = getMockAssessmentReport(id);

  if (format === "json") {
    return NextResponse.json(report, {
      headers: {
        "Content-Disposition": `attachment; filename="assessment-${id}.json"`,
      },
    });
  }

  if (format === "pdf") {
    // Generate HTML-based printable report (client prints to PDF via browser)
    const html = generatePdfHtml(report);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="assessment-${id}.html"`,
      },
    });
  }

  return NextResponse.json(
    { error: "Invalid format. Use ?format=json or ?format=pdf" },
    { status: 400 }
  );
}
