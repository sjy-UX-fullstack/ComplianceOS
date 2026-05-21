/**
 * Sprint 3 Task 3.2 + 3.3 — Subscriptions API
 *
 *   POST /api/v1/billing/subscriptions
 *     { planCode, billingCycle, customerEmail, customerContact, customerName }
 *     → { subscriptionId, authLinkUrl, status, plan }
 *
 *   GET /api/v1/billing/subscriptions?tenantId=...
 *     → { current, history }
 *
 * Creates a Razorpay subscription (UPI Autopay-compatible because
 * `total_count > 1` and `customer_notify=1`). Returns the `short_url`
 * the customer must open to approve the mandate in their UPI app.
 *
 * NOTE: Razorpay plan IDs are not persisted yet (Drizzle migration to add
 *       `plans.razorpay_plan_id_monthly` / `_yearly` is queued). For now we
 *       lazily create the Razorpay plan on first subscription request and
 *       echo the id back to the client; production should cache it in DB.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createRazorpayPlan,
  createSubscription,
  createUpiMandateAuth,
  RazorpayError,
} from "../../../../../lib/billing/razorpay";
import { getPlanByCode } from "@complianceos/db/plans";

export const runtime = "nodejs";

interface CreateSubscriptionBody {
  planCode: string;
  billingCycle: "monthly" | "yearly";
  tenantId: string;
  customerEmail: string;
  customerContact: string;
  customerName?: string;
  // Optional — caller may pass a previously-created Razorpay plan ID
  razorpayPlanId?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: CreateSubscriptionBody;
  try {
    body = (await req.json()) as CreateSubscriptionBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const plan = getPlanByCode(body.planCode);
  if (!plan) {
    return NextResponse.json(
      { error: `Unknown plan code: ${body.planCode}` },
      { status: 404 },
    );
  }
  if (plan.code === "free") {
    return NextResponse.json(
      { error: "Free tier does not require a subscription." },
      { status: 400 },
    );
  }
  if (plan.code === "enterprise") {
    return NextResponse.json(
      {
        error:
          "Enterprise is quote-driven. Contact sales@complianceos.in for a custom contract.",
      },
      { status: 400 },
    );
  }

  const amountInr =
    body.billingCycle === "yearly" ? plan.yearlyPriceInr : plan.monthlyPriceInr;

  try {
    // 1. Ensure Razorpay plan exists (lazy create until DB column lands)
    let razorpayPlanId = body.razorpayPlanId;
    if (!razorpayPlanId) {
      const rzpPlan = await createRazorpayPlan({
        planCode: plan.code,
        displayName: plan.displayName,
        amountInr,
        billingCycle: body.billingCycle,
      });
      razorpayPlanId = rzpPlan.id;
    }

    // 2. Create subscription. total_count: monthly=12 (1y), yearly=1 (1y)
    const sub = await createSubscription({
      razorpayPlanId,
      tenantId: body.tenantId,
      totalCount: body.billingCycle === "monthly" ? 12 : 1,
      notifyCustomer: true,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
    });

    // 3. Build UPI Autopay mandate link
    const mandate = await createUpiMandateAuth({
      razorpaySubscriptionId: sub.id,
      customerEmail: body.customerEmail,
      customerContact: body.customerContact,
    });

    return NextResponse.json(
      {
        subscriptionId: sub.id,
        razorpayPlanId,
        status: sub.status,
        authLinkUrl: mandate.authLinkUrl,
        plan: {
          code: plan.code,
          displayName: plan.displayName,
          billingCycle: body.billingCycle,
          amountInr,
        },
        totalCount: sub.total_count,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof RazorpayError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  // Stub — tenant subscription history needs DB query with RLS context.
  // Wired in Sprint 4 alongside DSR portal auth refactor.
  return NextResponse.json(
    {
      error:
        "Subscription history endpoint not yet wired. Use Razorpay Dashboard or webhook log.",
    },
    { status: 501 },
  );
}
