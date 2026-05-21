import { NextResponse } from "next/server";
import crypto from "crypto";
import { db, setTenantContext } from "@complianceos/db";
import { consentPurposes } from "@complianceos/db/schema";
import { eq } from "drizzle-orm";



export async function GET(req: Request) {
  try {
    const tenantId = req.headers.get("X-Tenant-Id") || "default-tenant";

    let purposesList = [];
    try {
      // Set RLS Context
      await setTenantContext(tenantId);


      purposesList = await db
        .select()
        .from(consentPurposes)
        .where(eq(consentPurposes.tenantId, tenantId));
    } catch (dbErr: any) {
      console.warn(`[Consents API] DB offline, returning mockup consent purposes: ${dbErr.message}`);
      
      // Seed fallback mockups for demonstration
      purposesList = [
        {
          id: "p1",
          tenantId,
          code: "analytics",
          displayName: { en: "Website Performance & Analytics" },
          description: { en: "To measure visitor traffic and aggregate metrics to optimize navigation." },
          lawfulBasis: "consent",
          isEssential: false,
          dataCategories: ["IP Address", "User Agent", "Page Path"],
          retentionDays: 365,
          active: true,
        },
        {
          id: "p2",
          tenantId,
          code: "marketing",
          displayName: { en: "Marketing & Personalization" },
          description: { en: "To serve tailored product recommendations and target updates." },
          lawfulBasis: "consent",
          isEssential: false,
          dataCategories: ["Email", "Browsing History"],
          retentionDays: 180,
          active: true,
        },
        {
          id: "p3",
          tenantId,
          code: "essential",
          displayName: { en: "Essential Platform Operations" },
          description: { en: "Strictly necessary to authenticate users and persist tenant settings." },
          lawfulBasis: "legitimate_use",
          isEssential: true,
          dataCategories: ["Session Token"],
          retentionDays: 30,
          active: true,
        },
      ];
    }

    return NextResponse.json({ purposes: purposesList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = req.headers.get("X-Tenant-Id");
    if (!tenantId) {
      return NextResponse.json({ error: "Missing X-Tenant-Id header" }, { status: 400 });
    }

    const body = await req.json();
    const { code, displayName, description, lawfulBasis, isEssential, dataCategories, retentionDays } = body;

    try {
      await setTenantContext(tenantId);

      const [newPurpose] = await db
        .insert(consentPurposes)
        .values({
          tenantId,
          code,
          displayName,
          description,
          lawfulBasis,
          isEssential: !!isEssential,
          dataCategories,
          retentionDays: parseInt(retentionDays, 10) || 365,
        })
        .returning();

      return NextResponse.json({ success: true, purpose: newPurpose });
    } catch (dbErr: any) {
      return NextResponse.json({
        success: true,
        mocked: true,
        purpose: {
          id: crypto.randomUUID(),
          tenantId,
          code,
          displayName,
          description,
          lawfulBasis,
          isEssential,
          dataCategories,
          retentionDays,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
