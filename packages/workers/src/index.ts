/**
 * ComplianceOS — BullMQ Workers
 * Background job definitions for audit, breach timers, retention, etc.
 */

export const QUEUES = {
  AUDIT_MERKLE: "audit:merkle-root",
  BREACH_TIMER: "breach:timer-alerts",
  DSR_SLA: "dsr:sla-alerts",
  RETENTION: "retention:pre-delete",
  COOKIE_SCAN: "consent:cookie-scanner",
  EMAIL: "notification:email",
  WHATSAPP: "notification:whatsapp",
  REPORT_GENERATION: "reports:generate",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
