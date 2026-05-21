/**
 * Sprint 5 Task 5.5 — File DPB Rule 7(2) initial or detailed report.
 *
 *   POST /api/v1/breaches/:id/file-dpb?kind=initial|detailed&format=json|html
 */

import { NextRequest, NextResponse } from "next/server";
import {
  buildDpbReport,
  renderDpbReportHtml,
} from "../../../../../../lib/breach/reports";
import {
  findBreachById,
  updateBreach,
} from "../../../../../../lib/breach/store";
import { canTransition, type BreachStatus } from "../../../../../../lib/breach/core";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Missing X-Tenant-Id header" }, { status: 400 });
  const { id } = await params;
  const kindParam = req.nextUrl.searchParams.get("kind") ?? "initial";
  const kind: "initial" | "detailed" = kindParam === "detailed" ? "detailed" : "initial";

  const breach = await findBreachById(id, tenantId);
  if (!breach || breach.tenantId !== tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filing = buildDpbReport(breach, kind);
  const now = new Date().toISOString();

  const nextStatusCandidate: BreachStatus =
    kind === "initial" ? "dpb_initial_filed" : "dpb_detailed_filed";

  await updateBreach(
    id,
    {
      ...(kind === "initial"
        ? { dpbInitialFiledAt: now }
        : { dpbDetailedFiledAt: now }),
      status: canTransition(breach.status, nextStatusCandidate) ? nextStatusCandidate : breach.status,
    },
    tenantId,
  );

  const format = req.nextUrl.searchParams.get("format") ?? "json";
  if (format === "html") {
    return new NextResponse(renderDpbReportHtml(filing), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return NextResponse.json({ filing, filedAt: now, kind });
}
