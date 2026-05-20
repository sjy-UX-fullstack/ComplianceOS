/**
 * ComplianceOS — Policy Templates
 * Lawyer-curated templates for DPDP compliance documents.
 * All templates marked "DRAFT — Legal review required" until counsel review.
 */

export const TEMPLATE_KINDS = [
  "privacy_notice",
  "cookie_policy",
  "retention_policy",
  "employee_privacy_policy",
  "dpa",
  "breach_playbook",
  "dpia_template",
] as const;

export type TemplateKind = (typeof TEMPLATE_KINDS)[number];
