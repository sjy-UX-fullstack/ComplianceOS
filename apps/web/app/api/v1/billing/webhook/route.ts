/**
 * Sprint 3 Task 3.5 — Razorpay webhook handler.
 *
 *   POST /api/v1/billing/webhook
 *
 * Razorpay POSTs every billing event here. We:
 *   1. Verify HMAC signature (X-Razorpay-Signature header)
 *   2. Switch on event type and dispatch to handlers
 *   3. Always return 200 quickly — Razorpay retries 5xx for up to 24h
 *
 * Persistence (subscriptions/invoices upsert) is stubbed pending the
 * tenant-context audit middleware that lands with Sprint 4. For now we
 * log every event to the audit trail so nothing is silently dropped.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  type RazorpayWebhookPayload,
  type RazorpayWebhookEvent,
} from "../../../../../lib/billing/razorpay";

export const runtime = "nodejs";

// Razorpay → our subscription status mapping
const SUBSCRIPTION_STATUS_MAP: Record<string, string> = {
  authenticated: "trialing",
  active: "active",
  pending: "past_due",
  halted: "halted",
  cancelled: "cancelled",
  completed: "completed",
  expired: "expired",
  paused: "paused",
};

interface AuditEntry {
  event: RazorpayWebhookEvent;
  receivedAt: string;
  tenantId?: string;
  subscriptionId?: string;
  paymentId?: string;
  amount?: number;
  status?: string;
}

function extractContext(
  payload: RazorpayWebhookPayload,
): Partial<AuditEntry> {
  const subEntity = payload.payload.subscription?.entity as
    | { id?: string; status?: string; notes?: { tenant_id?: string } }
    | undefined;
  const payEntity = payload.payload.payment?.entity as
    | { id?: string; amount?: number; status?: string }
    | undefined;

  return {
    tenantId: subEntity?.notes?.tenant_id,
    subscriptionId: subEntity?.id,
    paymentId: payEntity?.id,
    amount: payEntity?.amount,
    status:
      (subEntity?.status &&
        SUBSCRIPTION_STATUS_MAP[subEntity.status]) ||
      payEntity?.status,
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    // Always 400 on bad sig — do NOT echo why; do NOT 200.
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 },
    );
  }

  const entry: AuditEntry = {
    event: payload.event,
    receivedAt: new Date().toISOString(),
    ...extractContext(payload),
  };

  // Dispatch
  switch (payload.event) {
    case "subscription.authenticated":
      // UPI Autopay mandate confirmed. First debit will hit shortly.
      // TODO: subscriptions.status = 'trialing'
      break;
    case "subscription.activated":
    case "subscription.charged":
      // TODO: subscriptions.status = 'active'
      //       invoices.insert(... see /api/v1/billing/invoices)
      break;
    case "subscription.pending":
    case "subscription.halted":
      // Retry exhausted — flag for dunning.
      break;
    case "subscription.cancelled":
    case "subscription.completed":
    case "subscription.paused":
    case "subscription.resumed":
    case "subscription.updated":
      // TODO: subscriptions.status update
      break;
    case "payment.failed":
      // TODO: trigger dunning email + WhatsApp reminder
      break;
    case "payment.authorized":
    case "payment.captured":
    case "invoice.paid":
    case "invoice.partially_paid":
    case "invoice.expired":
      // No-op (we trust subscription.* for state)
      break;
    default:
      // Unknown event — log and ignore
      break;
  }

  // Stub: write `entry` to audit_logs via tenant-scoped audit middleware.
  // Until that lands, we log to stderr so events are visible in CloudWatch.
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.info("[razorpay-webhook]", JSON.stringify(entry));
  }

  return NextResponse.json({ received: true });
}
