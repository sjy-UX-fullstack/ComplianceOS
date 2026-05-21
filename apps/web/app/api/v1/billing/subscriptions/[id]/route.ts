/**
 * Sprint 3 — Cancel / fetch a single subscription.
 *
 *   GET    /api/v1/billing/subscriptions/:id
 *   DELETE /api/v1/billing/subscriptions/:id?atCycleEnd=true
 */

import { NextRequest, NextResponse } from "next/server";
import {
  cancelSubscription,
  fetchSubscription,
  RazorpayError,
} from "../../../../../../lib/billing/razorpay";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const sub = await fetchSubscription(id);
    return NextResponse.json(sub);
  } catch (err) {
    if (err instanceof RazorpayError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const atCycleEnd = req.nextUrl.searchParams.get("atCycleEnd") !== "false";
  try {
    const sub = await cancelSubscription(id, atCycleEnd);
    return NextResponse.json(sub);
  } catch (err) {
    if (err instanceof RazorpayError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
