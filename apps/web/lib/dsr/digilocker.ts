/**
 * ComplianceOS — DigiLocker / Setu identity verification
 * Sprint 4 Task 4.5
 *
 * Setu (https://setu.co/data/digilocker) wraps MeitY's DigiLocker for OAuth-
 * style consent + Aadhaar XML pull. The high-risk DSR verification flow
 * (erasure, nomination) uses this when email/mobile OTP isn't enough.
 *
 * Flow:
 *   1. POST /digilocker/initiate → returns Setu redirectUrl + requestId
 *   2. User authenticates with Setu → redirect back to our callback
 *   3. POST /digilocker/callback exchanges code → Aadhaar XML hash
 *   4. We store last-4 + verifiedAt; raw XML is NEVER persisted
 *
 * Until SETU_CLIENT_ID is set, the helper returns a deterministic stub
 * so the wizard flow remains testable.
 */

import crypto from "node:crypto";

export interface DigiLockerInitResult {
  setuRequestId: string;
  redirectUrl: string;
  expiresAt: string;
  stub: boolean;
}

const SETU_BASE = process.env.SETU_BASE_URL ?? "https://dg-sandbox.setu.co";

export async function initiateDigiLocker(input: {
  dsrId: string;
  callbackUrl: string;
}): Promise<DigiLockerInitResult> {
  const setuClientId = process.env.SETU_CLIENT_ID;
  const setuSecret = process.env.SETU_CLIENT_SECRET;

  if (!setuClientId || !setuSecret) {
    // Dev / preview stub
    const stubId = "stub_" + crypto.randomBytes(8).toString("hex");
    return {
      setuRequestId: stubId,
      redirectUrl: `${input.callbackUrl}?stub=1&request_id=${stubId}`,
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      stub: true,
    };
  }

  // Real Setu integration
  const res = await fetch(`${SETU_BASE}/api/digilocker`, {
    method: "POST",
    headers: {
      "x-client-id": setuClientId,
      "x-client-secret": setuSecret,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      redirectUrl: input.callbackUrl,
      docType: "ADHAR",
      reference: input.dsrId,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Setu DigiLocker init failed (${res.status}): ${body}`);
  }
  const json = (await res.json()) as {
    id: string;
    url: string;
    validUpto: string;
  };
  return {
    setuRequestId: json.id,
    redirectUrl: json.url,
    expiresAt: json.validUpto,
    stub: false,
  };
}

export interface DigiLockerVerifyResult {
  verifiedAt: string;
  aadhaarLast4: string;
  stub: boolean;
}

export async function verifyDigiLockerCallback(input: {
  setuRequestId: string;
  isStub?: boolean;
}): Promise<DigiLockerVerifyResult> {
  if (input.isStub || input.setuRequestId.startsWith("stub_")) {
    return {
      verifiedAt: new Date().toISOString(),
      aadhaarLast4: "1234",
      stub: true,
    };
  }
  const setuClientId = process.env.SETU_CLIENT_ID;
  const setuSecret = process.env.SETU_CLIENT_SECRET;
  if (!setuClientId || !setuSecret) {
    throw new Error("Setu credentials missing");
  }
  const res = await fetch(`${SETU_BASE}/api/digilocker/${input.setuRequestId}/status`, {
    headers: {
      "x-client-id": setuClientId,
      "x-client-secret": setuSecret,
    },
  });
  if (!res.ok) {
    throw new Error(`Setu DigiLocker status fetch failed (${res.status})`);
  }
  const json = (await res.json()) as {
    status: string;
    aadhaar?: { uid?: string };
  };
  if (json.status !== "SUCCESS") {
    throw new Error(`Setu DigiLocker verification not complete: ${json.status}`);
  }
  const uid = json.aadhaar?.uid ?? "";
  return {
    verifiedAt: new Date().toISOString(),
    aadhaarLast4: uid.slice(-4),
    stub: false,
  };
}
