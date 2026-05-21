/**
 * Sprint 4 Task 4.2 — Public DSR submission.
 *
 *   POST /api/v1/public/dsr
 *     body: {
 *       tenantId, requestType?, subject, bodyMd, contactEmail, contactMobile,
 *       language?, nominee?, channel?
 *     }
 *     → 201 { id, statusToken, statusUrl, slaDueAt, classification? }
 *
 * Flow:
 *   1. AI-classify the free-text body when requestType is absent
 *   2. Generate magic-link status token (hash → DB, plain → response only)
 *   3. Compute 90-day SLA due-at (Rule 14(3))
 *   4. Insert via store helper (DB if reachable, in-memory fallback)
 *   5. Enqueue submission notification to email + WhatsApp
 *
 * Unauthenticated — this is the data-principal-facing surface. Identity
 * verification (email/mobile OTP + DigiLocker) is a separate step.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  DSR_REQUEST_TYPES,
  type DsrRequestType,
  computeSlaDueAt,
  generateStatusToken,
} from "../../../../../lib/dsr/core";
import { insertDsr } from "../../../../../lib/dsr/store";
import { classifyDsr } from "../../../../../lib/ai/dsr-classifier";
import { buildSubmittedPayload, notify } from "../../../../../lib/dsr/notify";

export const runtime = "nodejs";

interface SubmissionBody {
  tenantId: string;
  requestType?: DsrRequestType;
  subject: string;
  bodyMd: string;
  contactEmail?: string;
  contactMobile?: string;
  language?: string;
  nominee?: string;
  channel?: "web" | "email" | "whatsapp" | "phone" | "offline";
}

function siteOrigin(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: SubmissionBody;
  try {
    body = (await req.json()) as SubmissionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Required fields
  if (!body.tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }
  if (!body.subject || !body.bodyMd) {
    return NextResponse.json(
      { error: "subject and bodyMd are required" },
      { status: 400 },
    );
  }
  if (!body.contactEmail && !body.contactMobile) {
    return NextResponse.json(
      { error: "At least one of contactEmail or contactMobile is required" },
      { status: 400 },
    );
  }

  // Honeypot — Sprint 4 light spam guard. Real rate limit comes in Sprint 6.
  if ((body as unknown as Record<string, unknown>)["website"]) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  // Classify when caller didn't pick a type
  let requestType: DsrRequestType;
  let classification = null;
  if (body.requestType && DSR_REQUEST_TYPES.includes(body.requestType)) {
    requestType = body.requestType;
  } else {
    classification = await classifyDsr(`${body.subject}\n\n${body.bodyMd}`);
    requestType = classification.requestType;
  }

  const { token, hash } = generateStatusToken();
  const slaDueAt = computeSlaDueAt();

  const record = await insertDsr({
    tenantId: body.tenantId,
    dataPrincipalRef: body.contactEmail ?? body.contactMobile ?? "anonymous",
    requestType,
    channel: body.channel ?? "web",
    status: "received",
    slaDueAt: slaDueAt.toISOString(),
    identityVerified: false,
    verificationMethod: null,
    closedAt: null,
    resolution: classification
      ? { aiClassification: classification }
      : null,
    nomineeRef: body.nominee ?? null,
    tokenHash: hash,
    subject: body.subject,
    bodyMd: body.bodyMd,
    contactEmail: body.contactEmail ?? null,
    contactMobile: body.contactMobile ?? null,
    language: body.language ?? "en",
    verificationState: {},
    alertsFired: [],
  });

  const statusUrl = `${siteOrigin(req)}/privacy/dsr/${token}`;
  await notify(buildSubmittedPayload(record, statusUrl));

  return NextResponse.json(
    {
      id: record.id,
      statusToken: token,
      statusUrl,
      slaDueAt: record.slaDueAt,
      requestType,
      classification,
    },
    { status: 201 },
  );
}
