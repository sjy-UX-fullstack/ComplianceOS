/**
 * ComplianceOS — DSR notifications
 * Sprint 4 Task 4.10
 *
 * Fan-out to email (SES), WhatsApp Business, and SMS (TRAI-DLT).
 *
 * Until SES / WhatsApp credentials are wired in Sprint 9 (Integrations),
 * we enqueue the payload to stdout in a structured form that the BullMQ
 * workers can later pick up. This keeps the API surface stable.
 */

import type { DsrRecord } from "./store";
import { REQUEST_TYPE_LABELS, STATUS_LABELS } from "./core";

export interface NotifyChannel {
  via: "email" | "whatsapp" | "sms";
  to: string;
}

export interface NotifyPayload {
  template:
    | "dsr_submitted"
    | "dsr_otp"
    | "dsr_verified"
    | "dsr_status_change"
    | "dsr_overdue"
    | "dsr_completed";
  channels: NotifyChannel[];
  variables: Record<string, string>;
  dsrId?: string;
  tenantId: string;
}

export async function notify(payload: NotifyPayload): Promise<void> {
  // Stub: log structured. Real impl pushes to BullMQ queues.EMAIL / .WHATSAPP / .SMS.
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.info("[dsr-notify]", JSON.stringify(payload));
  }
}

// ─── Convenience builders ──────────────────────────────────────────────────

export function buildSubmittedPayload(dsr: DsrRecord, statusUrl: string): NotifyPayload {
  const channels: NotifyChannel[] = [];
  if (dsr.contactEmail) channels.push({ via: "email", to: dsr.contactEmail });
  if (dsr.contactMobile) channels.push({ via: "whatsapp", to: dsr.contactMobile });
  return {
    template: "dsr_submitted",
    channels,
    tenantId: dsr.tenantId,
    dsrId: dsr.id,
    variables: {
      requestType: REQUEST_TYPE_LABELS[dsr.requestType],
      statusUrl,
      slaDueAt: dsr.slaDueAt,
      subject: dsr.subject ?? "(no subject)",
    },
  };
}

export function buildOtpPayload(
  dsr: DsrRecord,
  channel: "email" | "mobile",
  otp: string,
): NotifyPayload {
  const target = channel === "email" ? dsr.contactEmail : dsr.contactMobile;
  if (!target) {
    throw new Error(`Cannot send ${channel} OTP — no contact on record`);
  }
  return {
    template: "dsr_otp",
    channels: [{ via: channel === "email" ? "email" : "whatsapp", to: target }],
    tenantId: dsr.tenantId,
    dsrId: dsr.id,
    variables: { otp, ttlMinutes: "10" },
  };
}

export function buildStatusChangePayload(dsr: DsrRecord, statusUrl: string): NotifyPayload {
  const channels: NotifyChannel[] = [];
  if (dsr.contactEmail) channels.push({ via: "email", to: dsr.contactEmail });
  if (dsr.contactMobile) channels.push({ via: "whatsapp", to: dsr.contactMobile });
  return {
    template: "dsr_status_change",
    channels,
    tenantId: dsr.tenantId,
    dsrId: dsr.id,
    variables: {
      status: STATUS_LABELS[dsr.status],
      statusUrl,
    },
  };
}
