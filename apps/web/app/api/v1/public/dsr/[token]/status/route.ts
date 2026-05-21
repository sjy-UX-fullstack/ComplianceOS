/**
 * Sprint 4 Task 4.3 — Public DSR status polling.
 *
 *   GET /api/v1/public/dsr/:token/status
 *
 * Magic-link token (returned at submission time). We sha-256 it and look
 * up the request. The plain token is never persisted.
 *
 * Returns a minimal projection — no internal notes, no AI reasoning.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  hashStatusToken,
  computeSlaState,
  STATUS_LABELS,
  REQUEST_TYPE_LABELS,
} from "../../../../../../../lib/dsr/core";
import { findDsrByToken } from "../../../../../../../lib/dsr/store";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  const record = await findDsrByToken(hashStatusToken(token));
  if (!record) {
    // Don't leak whether it exists — same response either way.
    return NextResponse.json(
      { error: "Not found or expired" },
      { status: 404 },
    );
  }
  const sla = computeSlaState(new Date(record.slaDueAt));

  return NextResponse.json({
    id: record.id,
    requestType: record.requestType,
    requestTypeLabel: REQUEST_TYPE_LABELS[record.requestType],
    status: record.status,
    statusLabel: STATUS_LABELS[record.status],
    identityVerified: record.identityVerified,
    createdAt: record.createdAt,
    slaDueAt: record.slaDueAt,
    sla: {
      daysRemaining: sla.daysRemaining,
      severity: sla.severity,
      bucket: sla.bucket,
      isOverdue: sla.isOverdue,
    },
    subject: record.subject,
    language: record.language,
    closedAt: record.closedAt,
    // Verification surface — what the requester can still do
    verification: {
      emailPending:
        !record.identityVerified &&
        !!record.contactEmail &&
        !record.verificationState.email?.verifiedAt,
      mobilePending:
        !record.identityVerified &&
        !!record.contactMobile &&
        !record.verificationState.mobile?.verifiedAt,
      digilockerPending:
        !record.identityVerified &&
        !record.verificationState.digilocker?.verifiedAt,
    },
  });
}
