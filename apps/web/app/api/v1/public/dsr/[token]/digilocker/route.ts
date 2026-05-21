/**
 * Sprint 4 Task 4.5 — DigiLocker (Setu) high-risk identity verification.
 *
 *   POST /api/v1/public/dsr/:token/digilocker  → initiate, returns redirect URL
 *   PUT  /api/v1/public/dsr/:token/digilocker  → callback, finalises after Setu redirect
 *
 * Used for erasure / nomination requests where email/mobile OTP isn't
 * sufficient assurance. Setu wraps DigiLocker; raw Aadhaar XML never
 * touches our DB — only the last-4 + verifiedAt timestamp.
 */

import { NextRequest, NextResponse } from "next/server";
import { hashStatusToken } from "../../../../../../../lib/dsr/core";
import {
  findDsrByToken,
  updateDsr,
} from "../../../../../../../lib/dsr/store";
import {
  initiateDigiLocker,
  verifyDigiLockerCallback,
} from "../../../../../../../lib/dsr/digilocker";

export const runtime = "nodejs";

function siteOrigin(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;
  const dsr = await findDsrByToken(hashStatusToken(token));
  if (!dsr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dsr.identityVerified) {
    return NextResponse.json({ error: "Already verified" }, { status: 400 });
  }

  const callbackUrl = `${siteOrigin(req)}/privacy/dsr/${token}?source=digilocker`;
  const init = await initiateDigiLocker({ dsrId: dsr.id, callbackUrl });

  const verificationState = { ...dsr.verificationState };
  verificationState.digilocker = {
    setuRequestId: init.setuRequestId,
    redirectUrl: init.redirectUrl,
  };
  await updateDsr(dsr.id, { verificationState }, dsr.tenantId);

  return NextResponse.json({
    redirectUrl: init.redirectUrl,
    expiresAt: init.expiresAt,
    stub: init.stub,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;
  const body = (await req.json().catch(() => null)) as { stub?: boolean } | null;

  const dsr = await findDsrByToken(hashStatusToken(token));
  if (!dsr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const dl = dsr.verificationState.digilocker;
  if (!dl?.setuRequestId) {
    return NextResponse.json({ error: "Initiate DigiLocker first" }, { status: 400 });
  }

  const verified = await verifyDigiLockerCallback({
    setuRequestId: dl.setuRequestId,
    isStub: body?.stub ?? dl.setuRequestId.startsWith("stub_"),
  });

  const verificationState = { ...dsr.verificationState };
  verificationState.digilocker = {
    ...dl,
    verifiedAt: verified.verifiedAt,
    aadhaarLast4: verified.aadhaarLast4,
  };
  const updated = await updateDsr(
    dsr.id,
    {
      identityVerified: true,
      verificationMethod: "digilocker",
      status: dsr.status === "received" || dsr.status === "verifying" ? "verified" : dsr.status,
      verificationState,
    },
    dsr.tenantId,
  );

  return NextResponse.json({
    verified: true,
    aadhaarLast4: verified.aadhaarLast4,
    status: updated?.status,
    stub: verified.stub,
  });
}
