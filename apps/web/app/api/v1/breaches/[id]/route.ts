/**
 * Sprint 5 — Breach detail + transitions.
 *
 *   GET   /api/v1/breaches/:id
 *   PATCH /api/v1/breaches/:id
 *     body: { status?, rootCause?, containmentSteps?, severity? (override),
 *             affectedCount?, affectedCategories?, sectoralOverlays?, narrative?, title? }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  canTransition,
  computeClockState,
  STATUS_LABELS,
  CATEGORY_LABELS,
  type BreachCategory,
  type BreachStatus,
} from "../../../../../lib/breach/core";
import {
  findBreachById,
  updateBreach,
  type BreachContainmentStep,
} from "../../../../../lib/breach/store";
import {
  computeCustomDueAts,
  scoreBreach,
  type BreachSeverity,
  type BreachScoreInputs,
} from "@complianceos/rules-engine";

export const runtime = "nodejs";

function requireTenant(req: NextRequest): string | NextResponse {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Missing X-Tenant-Id header" }, { status: 400 });
  }
  return tenantId;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const tenant = requireTenant(req);
  if (tenant instanceof NextResponse) return tenant;
  const { id } = await params;

  const record = await findBreachById(id, tenant);
  if (!record || record.tenantId !== tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const now = new Date();
  return NextResponse.json({
    ...record,
    statusLabel: STATUS_LABELS[record.status],
    categoryLabel: CATEGORY_LABELS[record.category as BreachCategory] ?? record.category,
    certInClock: record.certInDueAt ? computeClockState(new Date(record.certInDueAt), now) : null,
    dpbClock: record.dpbDueAt ? computeClockState(new Date(record.dpbDueAt), now) : null,
  });
}

interface PatchBody {
  status?: BreachStatus;
  rootCause?: string;
  containmentSteps?: BreachContainmentStep[];
  severity?: BreachSeverity;
  affectedCount?: number;
  affectedCategories?: string[];
  sectoralOverlays?: string[];
  narrative?: string;
  title?: string;
  scoreInputs?: BreachScoreInputs;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const tenant = requireTenant(req);
  if (tenant instanceof NextResponse) return tenant;
  const { id } = await params;

  const existing = await findBreachById(id, tenant);
  if (!existing || existing.tenantId !== tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Partial<typeof existing> = {};

  if (body.status && body.status !== existing.status) {
    if (!canTransition(existing.status, body.status)) {
      return NextResponse.json(
        { error: `Invalid transition: ${existing.status} → ${body.status}` },
        { status: 400 },
      );
    }
    patch.status = body.status;
  }

  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.narrative === "string") patch.narrative = body.narrative;
  if (typeof body.rootCause === "string") patch.rootCause = body.rootCause;
  if (body.containmentSteps) patch.containmentSteps = body.containmentSteps;
  if (typeof body.affectedCount === "number") patch.affectedCount = body.affectedCount;
  if (body.affectedCategories) patch.affectedCategories = body.affectedCategories;
  if (body.sectoralOverlays) {
    patch.sectoralOverlays = body.sectoralOverlays;
    patch.customDueAts = computeCustomDueAts(new Date(existing.detectedAt), body.sectoralOverlays);
  }

  // Severity override: explicit value wins; else recompute from inputs.
  if (body.severity) {
    patch.severity = body.severity;
  } else if (body.scoreInputs) {
    patch.severity = scoreBreach(body.scoreInputs).severity;
  }

  const updated = await updateBreach(id, patch, tenant);
  return NextResponse.json(updated);
}
