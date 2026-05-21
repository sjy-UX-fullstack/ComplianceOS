/**
 * Sprint 5 Task 5.7 — Evidence attachment metadata.
 *
 *   POST /api/v1/breaches/:id/evidence
 *     body: { key, filename, sha256, sizeBytes, uploadedBy?, note? }
 *
 * Records the S3 Object Lock pointer + SHA-256 hash. The S3 upload itself
 * happens client-side via a pre-signed URL (Sprint 6 ship — until then,
 * the route accepts the metadata so the chain-of-custody log is captured).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  findBreachById,
  updateBreach,
  type BreachEvidence,
} from "../../../../../../lib/breach/store";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Missing X-Tenant-Id header" }, { status: 400 });
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as Partial<BreachEvidence> | null;
  if (!body?.key || !body.filename || !body.sha256 || typeof body.sizeBytes !== "number") {
    return NextResponse.json(
      { error: "key, filename, sha256, sizeBytes required" },
      { status: 400 },
    );
  }

  const breach = await findBreachById(id, tenantId);
  if (!breach || breach.tenantId !== tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const evidence: BreachEvidence = {
    key: body.key,
    filename: body.filename,
    sha256: body.sha256,
    sizeBytes: body.sizeBytes,
    uploadedAt: new Date().toISOString(),
    uploadedBy: body.uploadedBy,
    note: body.note,
  };
  const next = [...breach.evidence, evidence];

  await updateBreach(id, { evidence: next }, tenantId);
  return NextResponse.json({ evidence }, { status: 201 });
}
