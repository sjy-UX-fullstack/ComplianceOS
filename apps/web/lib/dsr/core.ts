/**
 * ComplianceOS — DSR core utilities
 * Sprint 4 — DSR Portal
 *
 * Pure functions for:
 *   - Token generation (status polling magic link)
 *   - 90-day SLA timer math (Rule 14(3))
 *   - State machine transitions
 *   - Severity colour for SLA chips
 *
 * No DB / no fetch — easy to unit-test.
 */

import crypto from "node:crypto";

// ─── Request types (DPDP §11–14) ───────────────────────────────────────────

export const DSR_REQUEST_TYPES = [
  "access", // §11(1)
  "correction", // §12(1)(a)
  "erasure", // §12(1)(c)
  "nomination", // §14
  "grievance", // §13(1)
  "withdrawal", // §6(4)
] as const;
export type DsrRequestType = (typeof DSR_REQUEST_TYPES)[number];

// ─── State machine ─────────────────────────────────────────────────────────

export const DSR_STATUSES = [
  "received", // submitted, identity not verified
  "verifying", // OTP / DigiLocker pending
  "verified", // identity confirmed
  "in_progress", // DPO acknowledged, working on it
  "info_needed", // requester input required (clock paused)
  "completed", // resolved within SLA
  "rejected", // legally/factually refused
  "grievance_overdue", // SLA breached → auto-escalation
] as const;
export type DsrStatus = (typeof DSR_STATUSES)[number];

const TRANSITIONS: Record<DsrStatus, DsrStatus[]> = {
  received: ["verifying", "verified", "rejected"],
  verifying: ["verified", "rejected"],
  verified: ["in_progress", "info_needed", "rejected"],
  in_progress: ["info_needed", "completed", "rejected"],
  info_needed: ["in_progress", "rejected"],
  completed: [],
  rejected: [],
  grievance_overdue: ["in_progress", "completed", "rejected"],
};

export function canTransition(from: DsrStatus, to: DsrStatus): boolean {
  // Any state can be force-moved to grievance_overdue by the SLA worker
  if (to === "grievance_overdue") return true;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── SLA timer ─────────────────────────────────────────────────────────────
// Rule 14(3): 90 days from submission. Alerts at T-30, T-10, T-1.

export const SLA_DAYS = 90;
export const ALERT_OFFSETS_DAYS = [30, 10, 1] as const;

export function computeSlaDueAt(submittedAt: Date = new Date()): Date {
  const due = new Date(submittedAt);
  due.setUTCDate(due.getUTCDate() + SLA_DAYS);
  return due;
}

export interface SlaState {
  dueAt: Date;
  daysRemaining: number;
  isOverdue: boolean;
  severity: "ok" | "warn" | "danger" | "overdue";
  bucket: "T-90+" | "T-30" | "T-10" | "T-1" | "T-0";
}

export function computeSlaState(dueAt: Date, now: Date = new Date()): SlaState {
  const msRemaining = dueAt.getTime() - now.getTime();
  const daysRemaining = Math.floor(msRemaining / 86_400_000);
  const isOverdue = daysRemaining < 0;

  let severity: SlaState["severity"];
  let bucket: SlaState["bucket"];

  if (isOverdue) {
    severity = "overdue";
    bucket = "T-0";
  } else if (daysRemaining <= 1) {
    severity = "danger";
    bucket = "T-1";
  } else if (daysRemaining <= 10) {
    severity = "danger";
    bucket = "T-10";
  } else if (daysRemaining <= 30) {
    severity = "warn";
    bucket = "T-30";
  } else {
    severity = "ok";
    bucket = "T-90+";
  }

  return { dueAt, daysRemaining, isOverdue, severity, bucket };
}

// ─── Polling tokens ────────────────────────────────────────────────────────
// 128-bit URL-safe; the requester gets this in their submission confirmation
// email/WhatsApp and uses it to check status without re-authenticating.
//
// Storage: hash before persisting (token_hash). The plain token NEVER hits
// the DB so a leaked dump cannot be replayed.

export function generateStatusToken(): { token: string; hash: string } {
  const buf = crypto.randomBytes(24);
  const token = buf.toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export function hashStatusToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─── OTP (email / mobile) ──────────────────────────────────────────────────
// 6-digit numeric. 10-minute TTL. Stored as HMAC hash with per-tenant salt.

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;

export function generateOtp(): string {
  // crypto.randomInt is bias-free; 100000–999999 for fixed-length codes
  return crypto.randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH).toString();
}

export function hashOtp(otp: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(otp).digest("hex");
}

export function verifyOtp(submitted: string, expectedHash: string, salt: string): boolean {
  const submittedHash = hashOtp(submitted, salt);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(submittedHash, "hex"),
      Buffer.from(expectedHash, "hex"),
    );
  } catch {
    return false;
  }
}

// ─── Public-facing labels ──────────────────────────────────────────────────

export const REQUEST_TYPE_LABELS: Record<DsrRequestType, string> = {
  access: "Access my data",
  correction: "Correct my data",
  erasure: "Erase my data",
  nomination: "Nominate someone in case of incapacity",
  grievance: "File a grievance",
  withdrawal: "Withdraw consent",
};

export const REQUEST_TYPE_DESCRIPTIONS: Record<DsrRequestType, string> = {
  access:
    "Receive a copy of the personal data you have shared, the purposes it is used for, and who it has been shared with. (DPDP §11)",
  correction:
    "Ask us to correct, complete or update your data when it is inaccurate or incomplete. (DPDP §12)",
  erasure:
    "Ask us to delete your data, except where retention is required by law or by an ongoing legal proceeding. (DPDP §12)",
  nomination:
    "Nominate another individual to exercise your rights in case of death or legal incapacity. (DPDP §14)",
  grievance:
    "Raise a complaint about how your data has been handled. We will respond within 90 days. (DPDP §13)",
  withdrawal:
    "Withdraw consent you previously granted for one or more purposes. Withdrawal does not affect lawful processing prior to withdrawal. (DPDP §6(4))",
};

export const STATUS_LABELS: Record<DsrStatus, string> = {
  received: "Received",
  verifying: "Verifying identity",
  verified: "Identity verified",
  in_progress: "In progress",
  info_needed: "Awaiting your input",
  completed: "Completed",
  rejected: "Closed",
  grievance_overdue: "Escalated (overdue)",
};
