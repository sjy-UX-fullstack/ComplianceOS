/**
 * ComplianceOS — Razorpay REST client (no SDK dependency)
 * Sprint 3 Tasks 3.2, 3.3, 3.5
 *
 * We hit Razorpay's REST API directly with `fetch` to avoid pulling in the
 * razorpay SDK (which is CJS-only and adds ~600KB). All Indian recurring
 * billing flows route through this module.
 *
 * Docs:
 *   - Subscriptions:  https://razorpay.com/docs/api/payments/subscriptions/
 *   - UPI Autopay:    https://razorpay.com/docs/payments/subscriptions/upi/
 *   - Webhooks:       https://razorpay.com/docs/webhooks/
 *
 * rule_ref: not directly DPDP — but invoice trail is referenced by Rule 8
 * (retention) and audit chain.
 */

import crypto from "node:crypto";

const RZP_BASE = "https://api.razorpay.com/v1";

function authHeader(): string {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) {
    throw new Error(
      "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not configured. " +
        "Set them in .env.local before calling the billing API.",
    );
  }
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

async function rzpFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`${RZP_BASE}${path}`, {
    ...rest,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : (rest.body as BodyInit | undefined),
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }
  if (!res.ok) {
    const err = parsed as { error?: { description?: string; code?: string } };
    throw new RazorpayError(
      err.error?.description ?? `Razorpay ${path} failed (${res.status})`,
      res.status,
      err.error?.code,
      parsed,
    );
  }
  return parsed as T;
}

export class RazorpayError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly raw?: unknown,
  ) {
    super(message);
    this.name = "RazorpayError";
  }
}

// ─── Plans ─────────────────────────────────────────────────────────────────
// A Razorpay "plan" must exist before a subscription. We mirror our local
// `plans` table → Razorpay plans 1:1 (one per billing cycle).

export interface RazorpayPlan {
  id: string;
  entity: "plan";
  item: { name: string; amount: number; currency: "INR" };
  period: "monthly" | "yearly";
  interval: number;
  notes: Record<string, string>;
}

export async function createRazorpayPlan(input: {
  planCode: string;
  displayName: string;
  amountInr: number; // rupees
  billingCycle: "monthly" | "yearly";
}): Promise<RazorpayPlan> {
  return rzpFetch<RazorpayPlan>("/plans", {
    method: "POST",
    json: {
      period: input.billingCycle,
      interval: 1,
      item: {
        name: `ComplianceOS — ${input.displayName} (${input.billingCycle})`,
        amount: input.amountInr * 100, // paise
        currency: "INR",
      },
      notes: {
        plan_code: input.planCode,
        billing_cycle: input.billingCycle,
      },
    },
  });
}

// ─── Subscriptions ─────────────────────────────────────────────────────────

export interface RazorpaySubscription {
  id: string;
  entity: "subscription";
  plan_id: string;
  status:
    | "created"
    | "authenticated"
    | "active"
    | "pending"
    | "halted"
    | "cancelled"
    | "completed"
    | "expired";
  current_start: number | null;
  current_end: number | null;
  total_count: number;
  paid_count: number;
  short_url: string;
  notes: Record<string, string>;
}

export async function createSubscription(input: {
  razorpayPlanId: string;
  tenantId: string;
  totalCount?: number; // 12 = 1y of monthly, 1 = single yearly
  notifyCustomer?: boolean;
  customerEmail?: string;
  customerName?: string;
}): Promise<RazorpaySubscription> {
  return rzpFetch<RazorpaySubscription>("/subscriptions", {
    method: "POST",
    json: {
      plan_id: input.razorpayPlanId,
      total_count: input.totalCount ?? 12,
      customer_notify: input.notifyCustomer ? 1 : 0,
      notify_info: input.customerEmail
        ? { notify_email: input.customerEmail }
        : undefined,
      notes: {
        tenant_id: input.tenantId,
        ...(input.customerName ? { customer_name: input.customerName } : {}),
      },
    },
  });
}

export async function cancelSubscription(
  razorpaySubscriptionId: string,
  cancelAtCycleEnd = true,
): Promise<RazorpaySubscription> {
  return rzpFetch<RazorpaySubscription>(
    `/subscriptions/${razorpaySubscriptionId}/cancel`,
    {
      method: "POST",
      json: { cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 },
    },
  );
}

export async function fetchSubscription(
  razorpaySubscriptionId: string,
): Promise<RazorpaySubscription> {
  return rzpFetch<RazorpaySubscription>(
    `/subscriptions/${razorpaySubscriptionId}`,
    { method: "GET" },
  );
}

// ─── UPI Autopay Mandate ───────────────────────────────────────────────────
// UPI Autopay requires:
//   1. A subscription created with `customer_notify=1`
//   2. A ₹1 (or configurable) authorization debit to confirm the mandate
//   3. The customer approves the mandate in their UPI app within 1 hour
//   4. Subsequent debits are auto-pulled on `current_start`
//
// This helper creates the auth transaction record. The actual debit is
// triggered when the customer clicks the short_url and confirms.

export async function createUpiMandateAuth(input: {
  razorpaySubscriptionId: string;
  customerEmail: string;
  customerContact: string;
}): Promise<{ authLinkUrl: string; orderId: string }> {
  // Razorpay handles the auth transaction internally when the subscription
  // is created with `total_count > 1` and the customer opens `short_url`.
  // We expose the URL here as a convenience; the order id is fetched from
  // the subscription.
  const sub = await fetchSubscription(input.razorpaySubscriptionId);
  return {
    authLinkUrl: sub.short_url,
    orderId: sub.id,
  };
}

// ─── Webhook signature verification ────────────────────────────────────────

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

// ─── Known webhook events we care about ────────────────────────────────────

export type RazorpayWebhookEvent =
  | "subscription.authenticated"
  | "subscription.activated"
  | "subscription.charged"
  | "subscription.completed"
  | "subscription.updated"
  | "subscription.pending"
  | "subscription.halted"
  | "subscription.cancelled"
  | "subscription.paused"
  | "subscription.resumed"
  | "payment.authorized"
  | "payment.captured"
  | "payment.failed"
  | "invoice.paid"
  | "invoice.partially_paid"
  | "invoice.expired";

export interface RazorpayWebhookPayload {
  entity: "event";
  account_id: string;
  event: RazorpayWebhookEvent;
  contains: string[];
  payload: Record<string, { entity: Record<string, unknown> }>;
  created_at: number;
}
