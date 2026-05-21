/**
 * Sprint 5 Task 5.4 — File CERT-In Annexure-I.
 *
 *   POST /api/v1/breaches/:id/file-certin?format=json|html
 *     → returns the rendered filing + stamps cert_in_filed_at
 *
 * Real submission requires posting to the CERT-In SOA portal (manual or
 * scripted with their API once published). This endpoint produces the
 * filing artifact and records the timestamp; the SLA worker uses
 * `certInFiledAt` to mute the T-0 alert.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  buildCertInAnnexureI,
  renderCertInHtml,
} from "../../../../../../lib/breach/reports";
import {
  findBreachById,
  updateBreach,
} from "../../../../../../lib/breach/store";
import { canTransition } from "../../../../../../lib/breach/core";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Missing X-Tenant-Id header" }, { status: 400 });
  const { id } = await params;

  const breach = await findBreachById(id, tenantId);
  if (!breach || breach.tenantId !== tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filing = buildCertInAnnexureI(breach);
  const now = new Date().toISOString();

  await updateBreach(
    id,
    {
      certInFiledAt: now,
      status: canTransition(breach.status, "cert_in_filed") ? "cert_in_filed" : breach.status,
    },
    tenantId,
  );

  const format = req.nextUrl.searchParams.get("format") ?? "json";
  if (format === "html") {
    return new NextResponse(renderCertInHtml(filing), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return NextResponse.json({ filing, filedAt: now });
}
