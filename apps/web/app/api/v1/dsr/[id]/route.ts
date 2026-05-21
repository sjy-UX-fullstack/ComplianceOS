/**
 * Sprint 4 Task 4.1 — Tenant-scoped DSR detail + state transitions.
 *
 *   GET   /api/v1/dsr/:id        → full record + AI classification + verification state
 *   PATCH /api/v1/dsr/:id        → transition status, add resolution payload, close request
 *
 * Transitions are validated against the state machine in lib/dsr/core.ts.
 * Once a record moves to `completed` or `rejected`, no further transitions
 * are allowed (except the SLA worker forcing `grievance_overdue`).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  canTransition,
  computeSlaState,
  REQUEST_TYPE_LABELS,
  STATUS_LABELS,
  type DsrStatus,
} from "../../../../../lib/dsr/core";
import { findDsrById, updateDsr } from "../../../../../lib/dsr/store";
import { buildStatusChangePayload, notify } from "../../../../../lib/dsr/notify";

export const runtime = "nodejs";

function siteOrigin(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`
  );
}

function requireTenant(req: NextRequest): string | NextResponse {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing X-Tenant-Id header" },
      { status: 400 },
    );
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

  const record = await findDsrById(id, tenant);
  if (!record || record.tenantId !== tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sla = computeSlaState(new Date(record.slaDueAt));
  return NextResponse.json({
    ...record,
    requestTypeLabel: REQUEST_TYPE_LABELS[record.requestType],
    statusLabel: STATUS_LABELS[record.status],
    sla,
  });
}

interface PatchBody {
  status?: DsrStatus;
  resolution?: Record<string, unknown>;
  nomineeRef?: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const tenant = requireTenant(req);
  if (tenant instanceof NextResponse) return tenant;
  const { id } = await params;

  const existing = await findDsrById(id, tenant);
  if (!existing || existing.tenantId !== tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Partial<typeof existing> = {};
  let statusChanged = false;

  if (body.status && body.status !== existing.status) {
    if (!canTransition(existing.status, body.status)) {
      return NextResponse.json(
        {
          error: `Invalid transition: ${existing.status} → ${body.status}`,
        },
        { status: 400 },
      );
    }
    patch.status = body.status;
    statusChanged = true;
    if (body.status === "completed" || body.status === "rejected") {
      patch.closedAt = new Date().toISOString();
    }
  }

  if (body.resolution) {
    patch.resolution = { ...(existing.resolution ?? {}), ...body.resolution };
  }
  if (typeof body.nomineeRef === "string") {
    patch.nomineeRef = body.nomineeRef;
  }

  const updated = await updateDsr(id, patch, tenant);
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  if (statusChanged) {
    // Find the original token via stored hash — we don't have it. We send a
    // generic link that the requester can use after re-authenticating via OTP.
    const statusUrl = `${siteOrigin(req)}/privacy/dsr`;
    await notify(buildStatusChangePayload(updated, statusUrl));
  }

  return NextResponse.json({
    ...updated,
    requestTypeLabel: REQUEST_TYPE_LABELS[updated.requestType],
    statusLabel: STATUS_LABELS[updated.status],
  });
}
