/**
 * Sprint 4 Task 4.1 — Tenant-scoped DSR list endpoint.
 *
 *   GET /api/v1/dsr  (requires X-Tenant-Id header)
 *     → { requests: DsrSummary[], counts: { open, overdue, breached, dueSoon } }
 *
 * Powers the DPO workflow board at /dpo/dsr.
 *
 * NOTE: Auth/RBAC enforcement comes from the tenancy middleware. For Sprint 4
 * we trust the X-Tenant-Id header as the consents route does — Clerk
 * session integration is queued for Sprint 6.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  computeSlaState,
  REQUEST_TYPE_LABELS,
  STATUS_LABELS,
  type DsrStatus,
} from "../../../../lib/dsr/core";
import { listDsrByTenant } from "../../../../lib/dsr/store";

export const runtime = "nodejs";

const OPEN_STATUSES: DsrStatus[] = [
  "received",
  "verifying",
  "verified",
  "in_progress",
  "info_needed",
  "grievance_overdue",
];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const tenantId =
    req.headers.get("x-tenant-id") ?? req.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing X-Tenant-Id header" },
      { status: 400 },
    );
  }

  const records = await listDsrByTenant(tenantId);
  const now = new Date();

  const enriched = records.map((r) => {
    const sla = computeSlaState(new Date(r.slaDueAt), now);
    return {
      id: r.id,
      requestType: r.requestType,
      requestTypeLabel: REQUEST_TYPE_LABELS[r.requestType],
      status: r.status,
      statusLabel: STATUS_LABELS[r.status],
      identityVerified: r.identityVerified,
      createdAt: r.createdAt,
      slaDueAt: r.slaDueAt,
      sla,
      subject: r.subject,
      contactEmail: r.contactEmail,
      contactMobile: r.contactMobile,
      language: r.language,
      channel: r.channel,
    };
  });

  const counts = {
    total: enriched.length,
    open: enriched.filter((r) => OPEN_STATUSES.includes(r.status)).length,
    overdue: enriched.filter((r) => r.sla.isOverdue && r.status !== "completed" && r.status !== "rejected").length,
    breached: enriched.filter((r) => r.status === "grievance_overdue").length,
    dueSoon: enriched.filter((r) => !r.sla.isOverdue && r.sla.severity === "danger").length,
  };

  return NextResponse.json({ requests: enriched, counts });
}
