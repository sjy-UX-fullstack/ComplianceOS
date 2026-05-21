import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@complianceos/db";
import { consentLogs } from "@complianceos/db/schema";


// Helper to calculate row hash chain
function calculateRowHash(prevHash: string, payload: any): string {
  const hmac = crypto.createHmac("sha256", "local-dev-secret-key-2026");
  const payloadStr = JSON.stringify(payload);
  hmac.update(prevHash + "|" + payloadStr);
  return hmac.digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, consents, prevHash = "0000000000000000000000000000000000000000000000000000000000000000", lang, userAgent } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
    }

    const payload = {
      consents,
      lang,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    // Chain the hash
    const rowHash = calculateRowHash(prevHash, payload);

    try {
      // Attempt db write if DB is configured
      await db.insert(consentLogs).values({
        tenantId,
        event: "consent_sync",
        payload,
        prevHash,
        rowHash,
      });
      console.log(`[Consent API] Synced consent log for tenant ${tenantId} to DB.`);
    } catch (dbErr: any) {
      // Graceful fallback for local dev when PG is offline
      console.warn(
        `[Consent API] DB offline/not configured, returning local fallback. Error: ${dbErr.message}`
      );
    }

    return NextResponse.json({
      success: true,
      rowHash,
    });
  } catch (error: any) {
    console.error("[Consent API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
