/**
 * ComplianceOS — Breach report generators (Sprint 5 Tasks 5.4, 5.5)
 *
 * Three filings the wizard produces:
 *   1. CERT-In Annexure-I    — 6h window
 *   2. DPB initial notice    — 72h "barest" report per Rule 7(2)
 *   3. DPB detailed notice   — follow-up within 72h with root cause + mitigation
 *
 * Outputs are deterministic, HTML-renderable, and JSON-serialisable so they
 * can be diff-tested against the official forms when those JSON schemas
 * are published.
 *
 * Reference docs (sources used in field naming):
 *   - CERT-In Direction No. 20(3)/2022-CERT-In, 28 Apr 2022 (Annexure-I)
 *   - DPDP Rules draft 2024, Rule 7(2)
 */

import type { BreachRecord } from "./store";
import { overlayByCode } from "@complianceos/rules-engine";

// ─── Shared types ──────────────────────────────────────────────────────────

export interface ReporterEntity {
  legalName: string;
  cin?: string;
  pan?: string;
  registeredAddress: string;
  primaryContact: {
    name: string;
    designation: string;
    email: string;
    phone: string;
  };
  cisoContact?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface CertInAnnexureI {
  formVersion: "2022-04-28-Annex-I";
  filing: {
    refNo: string;
    generatedAt: string;
    incidentDetectedAt: string;
    incidentReportedAt: string;
  };
  reporter: ReporterEntity;
  incident: {
    title: string;
    nature: string; // category label
    severity: string;
    summary: string;
    affectedSystems: string[];
    affectedDataCategories: string[];
    affectedCount: number | null;
    geographicScope: string;
    indicatorsOfCompromise: string[];
    suspectedThreatActor: string;
    rootCauseHypothesis: string;
    containmentActions: { step: string; doneAt?: string }[];
    referenceNumber: string;
  };
  evidence: {
    items: { filename: string; sha256: string; sizeBytes: number }[];
    lockedFor: "7 years (S3 Object Lock — Compliance Mode)";
  };
  attestation: {
    declaredBy: string;
    designation: string;
    declaredAt: string;
  };
}

export interface DpbReport {
  reportKind: "initial" | "detailed";
  formVersion: "DPDP-Rule-7(2)-2025";
  filing: {
    refNo: string;
    generatedAt: string;
    incidentDetectedAt: string;
    incidentReportedAt: string;
    dueAt: string;
  };
  reporter: ReporterEntity;
  summary: string;
  affectedDataPrincipals: {
    estimate: number | null;
    categories: string[];
    geographicScope: string;
  };
  natureOfBreach: string;
  causeOfBreach: string;
  mitigationMeasures: string[];
  riskAssessment: {
    severity: string;
    likelyHarm: string;
    childrenAffected: boolean;
    crossBorder: boolean;
  };
  containmentSteps: { step: string; doneAt?: string }[];
  // Detailed report adds:
  postMortem?: {
    rootCauseConfirmed: string;
    remediationCommitments: { item: string; targetDate?: string }[];
    futureSafeguards: string;
  };
  dataPrincipalCommunication: {
    method: string;
    sampleNotice: string;
    sentCount: number;
  };
  attestation: {
    declaredBy: string;
    designation: string;
    declaredAt: string;
  };
}

// ─── Defaults from env ─────────────────────────────────────────────────────

export function reporterFromEnv(): ReporterEntity {
  return {
    legalName:
      process.env.BILLING_LEGAL_ENTITY_NAME ??
      "ComplianceOS Technologies Pvt Ltd",
    pan: process.env.BILLING_LEGAL_ENTITY_PAN,
    registeredAddress:
      process.env.BILLING_LEGAL_ENTITY_ADDRESS ??
      "Bengaluru, Karnataka, India",
    primaryContact: {
      name: process.env.BREACH_PRIMARY_CONTACT_NAME ?? "Data Protection Officer",
      designation: process.env.BREACH_PRIMARY_CONTACT_DESIGNATION ?? "DPO",
      email: process.env.BREACH_PRIMARY_CONTACT_EMAIL ?? "dpo@complianceos.in",
      phone: process.env.BREACH_PRIMARY_CONTACT_PHONE ?? "+91 80 4567 8900",
    },
    cisoContact: process.env.BREACH_CISO_EMAIL
      ? {
          name: process.env.BREACH_CISO_NAME ?? "CISO",
          email: process.env.BREACH_CISO_EMAIL,
          phone: process.env.BREACH_CISO_PHONE ?? "",
        }
      : undefined,
  };
}

// ─── Builders ──────────────────────────────────────────────────────────────

export function buildCertInAnnexureI(
  breach: BreachRecord,
  reporter: ReporterEntity = reporterFromEnv(),
): CertInAnnexureI {
  return {
    formVersion: "2022-04-28-Annex-I",
    filing: {
      refNo: breach.refNo,
      generatedAt: new Date().toISOString(),
      incidentDetectedAt: breach.detectedAt,
      incidentReportedAt: breach.reportedAt ?? breach.createdAt,
    },
    reporter,
    incident: {
      title: breach.title ?? "(no title)",
      nature: breach.category,
      severity: breach.severity,
      summary: breach.narrative ?? "(no narrative)",
      affectedSystems: extractSystems(breach),
      affectedDataCategories: breach.affectedCategories,
      affectedCount: breach.affectedCount,
      geographicScope: "India (primary). See incident summary for cross-border details.",
      indicatorsOfCompromise: extractIocs(breach),
      suspectedThreatActor: breach.aiClassification?.rootCauseHypothesis ?? "Under investigation",
      rootCauseHypothesis:
        breach.rootCause ??
        breach.aiClassification?.rootCauseHypothesis ??
        "Investigation ongoing",
      containmentActions: breach.containmentSteps.map(({ step, doneAt }) => ({ step, doneAt })),
      referenceNumber: breach.refNo,
    },
    evidence: {
      items: breach.evidence.map((e) => ({
        filename: e.filename,
        sha256: e.sha256,
        sizeBytes: e.sizeBytes,
      })),
      lockedFor: "7 years (S3 Object Lock — Compliance Mode)",
    },
    attestation: {
      declaredBy: reporter.primaryContact.name,
      designation: reporter.primaryContact.designation,
      declaredAt: new Date().toISOString(),
    },
  };
}

export function buildDpbReport(
  breach: BreachRecord,
  kind: "initial" | "detailed",
  reporter: ReporterEntity = reporterFromEnv(),
): DpbReport {
  const childrenAffected = breach.affectedCategories.some((c) =>
    ["minor_data", "children"].includes(c.toLowerCase()),
  );

  const report: DpbReport = {
    reportKind: kind,
    formVersion: "DPDP-Rule-7(2)-2025",
    filing: {
      refNo: breach.refNo,
      generatedAt: new Date().toISOString(),
      incidentDetectedAt: breach.detectedAt,
      incidentReportedAt: breach.reportedAt ?? breach.createdAt,
      dueAt: breach.dpbDueAt ?? new Date().toISOString(),
    },
    reporter,
    summary: breach.narrative ?? "(no narrative)",
    affectedDataPrincipals: {
      estimate: breach.affectedCount,
      categories: breach.affectedCategories,
      geographicScope: "India",
    },
    natureOfBreach: breach.category,
    causeOfBreach:
      breach.rootCause ??
      breach.aiClassification?.rootCauseHypothesis ??
      "Under investigation",
    mitigationMeasures: breach.containmentSteps.map((s) => s.step),
    riskAssessment: {
      severity: breach.severity,
      likelyHarm:
        breach.severity === "critical"
          ? "Significant financial, reputational and personal-safety harm probable."
          : breach.severity === "high"
            ? "Material harm to a substantial number of data principals."
            : "Limited harm to a small number of data principals.",
      childrenAffected,
      crossBorder: breach.sectoralOverlays.some((o) => overlayByCode(o)?.appliesTo?.length),
    },
    containmentSteps: breach.containmentSteps.map(({ step, doneAt }) => ({ step, doneAt })),
    dataPrincipalCommunication: {
      method: "email + WhatsApp + in-app banner",
      sampleNotice: buildPrincipalNoticeText(breach),
      sentCount: breach.notificationsSent,
    },
    attestation: {
      declaredBy: reporter.primaryContact.name,
      designation: reporter.primaryContact.designation,
      declaredAt: new Date().toISOString(),
    },
  };

  if (kind === "detailed") {
    report.postMortem = {
      rootCauseConfirmed:
        breach.rootCause ??
        breach.aiClassification?.rootCauseHypothesis ??
        "(to be filled before submission)",
      remediationCommitments: [
        { item: "Patch impacted systems and rotate credentials", targetDate: undefined },
        { item: "External red-team review of the affected component" },
        { item: "Update DPIA + RoPA entries for the affected processing activity" },
      ],
      futureSafeguards:
        "Additional detection rules, mandatory MFA, and quarterly tabletop exercises will be put in place.",
    };
  }
  return report;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function extractSystems(breach: BreachRecord): string[] {
  // Pull keywords from the narrative + AI classification. Free-form, but at
  // least pre-populated for the filer to confirm.
  const words = (breach.narrative ?? "").match(/\b[A-Z][a-zA-Z0-9-]{2,}\b/g) ?? [];
  return [...new Set(words)].slice(0, 8);
}

function extractIocs(breach: BreachRecord): string[] {
  const text = `${breach.narrative ?? ""} ${breach.rootCause ?? ""}`;
  const ipv4 = text.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) ?? [];
  const sha = text.match(/\b[a-f0-9]{40,64}\b/gi) ?? [];
  return [...new Set([...ipv4, ...sha])];
}

export function buildPrincipalNoticeText(breach: BreachRecord): string {
  return `Dear customer,

We are writing to inform you of a security incident detected on ${formatDate(breach.detectedAt)} affecting some of your personal data.

What happened
${breach.narrative ?? "(details under preparation)"}

What we are doing
${breach.containmentSteps.map((s) => `- ${s.step}`).join("\n") || "- Investigation and containment underway"}

What you should do
- Watch out for unsolicited communication claiming to be from us
- Reset any passwords you may have reused on other services
- Reach our DPO at dpo@${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() ?? "complianceos"}.in for any questions

Sincerely,
Data Protection Officer
Reference: ${breach.refNo}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ─── HTML renderers ────────────────────────────────────────────────────────

const SHELL = (title: string, body: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
* { box-sizing: border-box; }
body { font: 13px/1.55 "Inter", system-ui, sans-serif; color: #0f172a; padding: 32px; max-width: 920px; margin: 0 auto; }
h1 { margin: 0 0 4px; font-size: 22px; }
h2 { font-size: 14px; margin: 24px 0 6px; text-transform: uppercase; letter-spacing: .05em; color: #475569; }
.meta { color: #64748b; font-size: 12px; margin-bottom: 16px; }
section { margin-bottom: 16px; }
dl { display: grid; grid-template-columns: 220px 1fr; gap: 4px 16px; margin: 0; }
dt { color: #64748b; }
dd { margin: 0; }
ul { margin: 4px 0 0; padding-left: 18px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
th { background: #f1f5f9; }
.tag { display: inline-block; padding: 1px 8px; border-radius: 4px; background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 600; }
.code { font-family: ui-monospace, monospace; font-size: 12px; }
footer { margin-top: 32px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
</style></head><body>${body}</body></html>`;

export function renderCertInHtml(rep: CertInAnnexureI): string {
  return SHELL(
    `CERT-In Annexure-I · ${rep.filing.refNo}`,
    `
<h1>CERT-In Incident Reporting Form (Annexure-I)</h1>
<div class="meta">Form ${escapeHtml(rep.formVersion)} · Ref ${escapeHtml(rep.filing.refNo)} · Generated ${escapeHtml(formatDate(rep.filing.generatedAt))}</div>
<section>
  <h2>1. Reporting Entity</h2>
  <dl>
    <dt>Legal name</dt><dd>${escapeHtml(rep.reporter.legalName)}</dd>
    <dt>Address</dt><dd>${escapeHtml(rep.reporter.registeredAddress)}</dd>
    ${rep.reporter.cin ? `<dt>CIN</dt><dd>${escapeHtml(rep.reporter.cin)}</dd>` : ""}
    ${rep.reporter.pan ? `<dt>PAN</dt><dd>${escapeHtml(rep.reporter.pan)}</dd>` : ""}
    <dt>Primary contact</dt><dd>${escapeHtml(rep.reporter.primaryContact.name)} (${escapeHtml(rep.reporter.primaryContact.designation)})<br>${escapeHtml(rep.reporter.primaryContact.email)} · ${escapeHtml(rep.reporter.primaryContact.phone)}</dd>
    ${rep.reporter.cisoContact ? `<dt>CISO</dt><dd>${escapeHtml(rep.reporter.cisoContact.name)}<br>${escapeHtml(rep.reporter.cisoContact.email)} · ${escapeHtml(rep.reporter.cisoContact.phone)}</dd>` : ""}
  </dl>
</section>
<section>
  <h2>2. Incident Details</h2>
  <dl>
    <dt>Title</dt><dd>${escapeHtml(rep.incident.title)}</dd>
    <dt>Nature</dt><dd>${escapeHtml(rep.incident.nature)}</dd>
    <dt>Severity</dt><dd><span class="tag">${escapeHtml(rep.incident.severity.toUpperCase())}</span></dd>
    <dt>Detected at (IST)</dt><dd>${escapeHtml(formatDate(rep.filing.incidentDetectedAt))}</dd>
    <dt>Reported at (IST)</dt><dd>${escapeHtml(formatDate(rep.filing.incidentReportedAt))}</dd>
    <dt>Affected data principals</dt><dd>${rep.incident.affectedCount ?? "Not yet quantified"}</dd>
    <dt>Affected categories</dt><dd>${rep.incident.affectedDataCategories.map(escapeHtml).join(", ") || "—"}</dd>
    <dt>Geographic scope</dt><dd>${escapeHtml(rep.incident.geographicScope)}</dd>
    <dt>Suspected actor</dt><dd>${escapeHtml(rep.incident.suspectedThreatActor)}</dd>
  </dl>
  <h2>Summary</h2>
  <p>${escapeHtml(rep.incident.summary).replace(/\n/g, "<br>")}</p>
  <h2>Root-cause hypothesis</h2>
  <p>${escapeHtml(rep.incident.rootCauseHypothesis)}</p>
</section>
<section>
  <h2>3. Indicators of Compromise</h2>
  ${rep.incident.indicatorsOfCompromise.length
    ? `<ul>${rep.incident.indicatorsOfCompromise.map((i) => `<li class="code">${escapeHtml(i)}</li>`).join("")}</ul>`
    : `<p>None extracted at this time.</p>`}
</section>
<section>
  <h2>4. Containment Actions</h2>
  ${rep.incident.containmentActions.length
    ? `<ul>${rep.incident.containmentActions.map((c) => `<li>${escapeHtml(c.step)}${c.doneAt ? ` <span class="meta">(completed ${escapeHtml(formatDate(c.doneAt))})</span>` : ""}</li>`).join("")}</ul>`
    : `<p>Containment plan being executed.</p>`}
</section>
<section>
  <h2>5. Evidence (S3 Object Lock — Compliance Mode, 7y)</h2>
  ${rep.evidence.items.length
    ? `<table><thead><tr><th>Filename</th><th>SHA-256</th><th>Size</th></tr></thead><tbody>${rep.evidence.items.map((e) => `<tr><td>${escapeHtml(e.filename)}</td><td class="code">${escapeHtml(e.sha256)}</td><td>${formatBytes(e.sizeBytes)}</td></tr>`).join("")}</tbody></table>`
    : `<p>No evidence attached yet.</p>`}
</section>
<section>
  <h2>6. Attestation</h2>
  <p>I confirm the above information is accurate to the best of my knowledge.</p>
  <dl>
    <dt>Declared by</dt><dd>${escapeHtml(rep.attestation.declaredBy)} (${escapeHtml(rep.attestation.designation)})</dd>
    <dt>Declared at</dt><dd>${escapeHtml(formatDate(rep.attestation.declaredAt))}</dd>
  </dl>
</section>
<footer>
  Filed under CERT-In Direction No. 20(3)/2022-CERT-In, dated 28 Apr 2022.
  Computer-generated by ComplianceOS — incident reference ${escapeHtml(rep.filing.refNo)}.
</footer>`,
  );
}

export function renderDpbReportHtml(rep: DpbReport): string {
  const kindLabel = rep.reportKind === "initial" ? "Initial Notice (Rule 7(2))" : "Detailed Report (Rule 7(2))";
  return SHELL(
    `DPB ${kindLabel} · ${rep.filing.refNo}`,
    `
<h1>Data Protection Board of India — ${escapeHtml(kindLabel)}</h1>
<div class="meta">Form ${escapeHtml(rep.formVersion)} · Ref ${escapeHtml(rep.filing.refNo)} · Generated ${escapeHtml(formatDate(rep.filing.generatedAt))} · Due ${escapeHtml(formatDate(rep.filing.dueAt))}</div>
<section>
  <h2>1. Reporting Entity</h2>
  <dl>
    <dt>Legal name</dt><dd>${escapeHtml(rep.reporter.legalName)}</dd>
    <dt>Address</dt><dd>${escapeHtml(rep.reporter.registeredAddress)}</dd>
    <dt>Primary contact</dt><dd>${escapeHtml(rep.reporter.primaryContact.name)} (${escapeHtml(rep.reporter.primaryContact.designation)}) · ${escapeHtml(rep.reporter.primaryContact.email)}</dd>
  </dl>
</section>
<section>
  <h2>2. Incident Summary</h2>
  <p>${escapeHtml(rep.summary).replace(/\n/g, "<br>")}</p>
  <dl>
    <dt>Nature</dt><dd>${escapeHtml(rep.natureOfBreach)}</dd>
    <dt>Cause</dt><dd>${escapeHtml(rep.causeOfBreach)}</dd>
    <dt>Affected data principals</dt><dd>${rep.affectedDataPrincipals.estimate ?? "Under estimation"}</dd>
    <dt>Affected categories</dt><dd>${rep.affectedDataPrincipals.categories.map(escapeHtml).join(", ") || "—"}</dd>
    <dt>Geographic scope</dt><dd>${escapeHtml(rep.affectedDataPrincipals.geographicScope)}</dd>
  </dl>
</section>
<section>
  <h2>3. Risk Assessment</h2>
  <dl>
    <dt>Severity</dt><dd><span class="tag">${escapeHtml(rep.riskAssessment.severity.toUpperCase())}</span></dd>
    <dt>Likely harm</dt><dd>${escapeHtml(rep.riskAssessment.likelyHarm)}</dd>
    <dt>Children affected</dt><dd>${rep.riskAssessment.childrenAffected ? "Yes" : "No"}</dd>
    <dt>Cross-border</dt><dd>${rep.riskAssessment.crossBorder ? "Yes" : "No"}</dd>
  </dl>
</section>
<section>
  <h2>4. Mitigation &amp; Containment</h2>
  ${rep.mitigationMeasures.length
    ? `<ul>${rep.mitigationMeasures.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul>`
    : `<p>Mitigation underway.</p>`}
</section>
<section>
  <h2>5. Data-Principal Communication</h2>
  <dl>
    <dt>Method</dt><dd>${escapeHtml(rep.dataPrincipalCommunication.method)}</dd>
    <dt>Recipients</dt><dd>${rep.dataPrincipalCommunication.sentCount}</dd>
  </dl>
  <p style="background:#f1f5f9; padding:12px; border-radius:6px; white-space:pre-wrap;">${escapeHtml(rep.dataPrincipalCommunication.sampleNotice)}</p>
</section>
${rep.postMortem ? `
<section>
  <h2>6. Post-mortem (Detailed report)</h2>
  <dl>
    <dt>Root cause confirmed</dt><dd>${escapeHtml(rep.postMortem.rootCauseConfirmed)}</dd>
    <dt>Future safeguards</dt><dd>${escapeHtml(rep.postMortem.futureSafeguards)}</dd>
  </dl>
  <h2>Remediation commitments</h2>
  <ul>${rep.postMortem.remediationCommitments.map((r) => `<li>${escapeHtml(r.item)}${r.targetDate ? ` — target ${escapeHtml(r.targetDate)}` : ""}</li>`).join("")}</ul>
</section>` : ""}
<section>
  <h2>7. Attestation</h2>
  <dl>
    <dt>Declared by</dt><dd>${escapeHtml(rep.attestation.declaredBy)} (${escapeHtml(rep.attestation.designation)})</dd>
    <dt>Declared at</dt><dd>${escapeHtml(formatDate(rep.attestation.declaredAt))}</dd>
  </dl>
</section>
<footer>Filed under DPDP Rule 7(2). Reference ${escapeHtml(rep.filing.refNo)}.</footer>`,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
