/**
 * Sprint 4 Task 4.4 — OTP request + verify.
 *
 *   POST /api/v1/public/dsr/:token/otp           (request)
 *     body: { channel: "email" | "mobile" }
 *     → { sent: true, expiresAt }
 *
 *   PUT  /api/v1/public/dsr/:token/otp           (verify)
 *     body: { channel: "email" | "mobile", otp: "123456" }
 *     → { verified: true, identityVerified, statusUrl }
 *
 * - 10-minute TTL
 * - 5-attempt cap per channel; further attempts force a new OTP
 * - OTP stored as HMAC-SHA256 with a per-request salt
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  hashStatusToken,
  generateOtp,
  hashOtp,
  verifyOtp,
  OTP_TTL_MINUTES,
} from "../../../../../../../lib/dsr/core";
import { findDsrByToken, updateDsr } from "../../../../../../../lib/dsr/store";
import { buildOtpPayload, notify } from "../../../../../../../lib/dsr/notify";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

interface RequestBody {
  channel: "email" | "mobile";
}
interface VerifyBody extends RequestBody {
  otp: string;
}

async function loadDsr(token: string) {
  return findDsrByToken(hashStatusToken(token));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;
  const body = (await req.json().catch(() => null)) as RequestBody | null;
  if (!body || (body.channel !== "email" && body.channel !== "mobile")) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const dsr = await loadDsr(token);
  if (!dsr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dsr.identityVerified) {
    return NextResponse.json({ error: "Already verified" }, { status: 400 });
  }

  const contact = body.channel === "email" ? dsr.contactEmail : dsr.contactMobile;
  if (!contact) {
    return NextResponse.json(
      { error: `No ${body.channel} on file` },
      { status: 400 },
    );
  }

  const otp = generateOtp();
  const salt = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

  const verificationState = { ...dsr.verificationState };
  verificationState[body.channel] = {
    otpHash: hashOtp(otp, salt),
    otpSalt: salt,
    expiresAt,
    attempts: 0,
  };

  await updateDsr(dsr.id, { verificationState }, dsr.tenantId);

  // Fire-and-forget notify; we never expose the OTP in the API response
  await notify(buildOtpPayload(dsr, body.channel, otp));

  return NextResponse.json({ sent: true, expiresAt });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;
  const body = (await req.json().catch(() => null)) as VerifyBody | null;
  if (!body || (body.channel !== "email" && body.channel !== "mobile") || !body.otp) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const dsr = await loadDsr(token);
  if (!dsr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dsr.identityVerified) {
    return NextResponse.json({ verified: true, identityVerified: true });
  }

  const channelState = dsr.verificationState[body.channel];
  if (!channelState?.otpHash || !channelState.otpSalt || !channelState.expiresAt) {
    return NextResponse.json({ error: "Request an OTP first" }, { status: 400 });
  }
  if (new Date(channelState.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "OTP expired — request a new one" }, { status: 400 });
  }
  if (channelState.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many attempts — request a new OTP" },
      { status: 429 },
    );
  }

  const ok = verifyOtp(body.otp, channelState.otpHash, channelState.otpSalt);

  const verificationState = { ...dsr.verificationState };
  if (!ok) {
    verificationState[body.channel] = {
      ...channelState,
      attempts: channelState.attempts + 1,
    };
    await updateDsr(dsr.id, { verificationState }, dsr.tenantId);
    return NextResponse.json({ error: "Wrong OTP" }, { status: 400 });
  }

  // Verified
  verificationState[body.channel] = {
    ...channelState,
    verifiedAt: new Date().toISOString(),
    attempts: channelState.attempts + 1,
  };

  const newStatus = dsr.status === "received" ? "verifying" : dsr.status;
  const updated = await updateDsr(
    dsr.id,
    {
      identityVerified: true,
      verificationMethod: body.channel === "email" ? "email_otp" : "mobile_otp",
      status: newStatus === "verifying" ? "verified" : newStatus,
      verificationState,
    },
    dsr.tenantId,
  );

  return NextResponse.json({
    verified: true,
    identityVerified: true,
    status: updated?.status,
  });
}
