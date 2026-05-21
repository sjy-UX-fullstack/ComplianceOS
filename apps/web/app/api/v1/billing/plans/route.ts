/**
 * Sprint 3 — Plan catalog endpoint.
 *
 *   GET /api/v1/billing/plans  → array of PlanSeed
 *
 * Static read from the in-app seed. Public — used by the marketing pricing
 * page and the in-app upgrade modal. No tenant context required.
 */

import { NextResponse } from "next/server";
import { PLANS_SEED, AGENCY_PER_CLIENT_INR, GST_RATE } from "@complianceos/db/plans";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    plans: PLANS_SEED,
    agencyPerClientInr: AGENCY_PER_CLIENT_INR,
    gstRate: GST_RATE,
  });
}
