/**
 * ComplianceOS — DPDP Rules Engine
 * Encodes DPDP Act 2023 rules as executable logic.
 * Used by Assessment, Breach Wizard, Retention, and Compliance Score modules.
 */

import { DPDP_RULES, BREACH_TIMERS, DSR_SLA } from "@complianceos/config";

export { DPDP_RULES, BREACH_TIMERS, DSR_SLA };

/**
 * Calculate breach report deadlines from detection time.
 */
export function calculateBreachDeadlines(detectedAt: Date) {
  const certInDue = new Date(detectedAt.getTime() + BREACH_TIMERS.CERT_IN_HOURS * 60 * 60 * 1000);
  const dpbDue = new Date(detectedAt.getTime() + BREACH_TIMERS.DPB_HOURS * 60 * 60 * 1000);

  return {
    certInDue,
    dpbDue,
    certInRemainingMs: Math.max(0, certInDue.getTime() - Date.now()),
    dpbRemainingMs: Math.max(0, dpbDue.getTime() - Date.now()),
  };
}

/**
 * Calculate DSR SLA deadline from request creation.
 */
export function calculateDsrSla(createdAt: Date) {
  const dueAt = new Date(createdAt.getTime() + DSR_SLA.DAYS * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.ceil((dueAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  return {
    dueAt,
    daysRemaining,
    isOverdue: daysRemaining < 0,
    alertLevel: daysRemaining <= 1 ? "critical" : daysRemaining <= 10 ? "warning" : daysRemaining <= 30 ? "info" : "none",
  };
}
