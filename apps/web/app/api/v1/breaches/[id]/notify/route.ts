/**
 * Sprint 5 Task 5.6 — Notify affected data principals.
 *
 *   POST /api/v1/breaches/:id/notify
 *     body: { recipients: [{ email?, mobile? }], dryRun?: boolean }
 *     → { sent, payload }
 *
 * Stub-fans out via lib/breach/notify (BullMQ workers land in Sprint 9).
 * Increments `notifications_sent` on the breach.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  findBreachById,
  updateBreach,
} from "../../../../../../lib/breach/store";
import {
  buildPrincipalNotifyPayload,
  notifyBreach,
} from "../../../../../../lib/breach/notify";
import { canTransition } from "../../../../../../lib/breach/core";

export const runtime = "nodejs";

interface NotifyBody {
  recipients: { email?: string; mobile?: string }[];
  dryRun?: boolean;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Missing X-Tenant-Id header" }, { status: 400 });
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as NotifyBody | null;
  if (!body || !Array.isArray(body.recipients) || body.recipients.length === 0) {
    return NextResponse.json({ error: "recipients[] required" }, { status: 400 });
  }

  const breach = await findBreachById(id, tenantId);
  if (!breach || breach.tenantId !== tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload = buildPrincipalNotifyPayload(breach, body.recipients);
  if (!body.dryRun) {
    await notifyBreach(payload);
    await updateBreach(
      id,
      {
        notificationsSent: (breach.notificationsSent ?? 0) + body.recipients.length,
        status: canTransition(breach.status, "principals_notified")
          ? "principals_notified"
          : breach.status,
      },
      tenantId,
    );
  }
  return NextResponse.json({ sent: body.recipients.length, payload, dryRun: !!body.dryRun });
}
