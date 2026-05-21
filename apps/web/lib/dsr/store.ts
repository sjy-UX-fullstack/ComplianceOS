/**
 * ComplianceOS — DSR persistence layer (Sprint 4)
 *
 * Mirrors the dsr_requests Drizzle schema. Two backends:
 *   1. PostgreSQL via Drizzle (preferred, when DATABASE_URL reachable)
 *   2. Process-local Map fallback (dev / preview / DB-offline)
 *
 * Public surfaces always go through these helpers — never query the table
 * directly from a route. This keeps the in-memory fallback honest.
 *
 * NOTE: The in-memory store is process-local and lost on restart. Fine
 * for the Sprint-4 demo flow (submit → OTP → status); production must
 * have a real DB.
 */

import crypto from "node:crypto";
import type { DsrRequestType, DsrStatus } from "./core";

export interface DsrVerificationState {
  email?: {
    otpHash?: string;
    otpSalt?: string;
    expiresAt?: string;
    attempts: number;
    verifiedAt?: string;
  };
  mobile?: {
    otpHash?: string;
    otpSalt?: string;
    expiresAt?: string;
    attempts: number;
    verifiedAt?: string;
  };
  digilocker?: {
    setuRequestId?: string;
    redirectUrl?: string;
    aadhaarLast4?: string;
    verifiedAt?: string;
  };
}

export interface DsrRecord {
  id: string;
  tenantId: string;
  dataPrincipalRef: string;
  requestType: DsrRequestType;
  channel: string;
  status: DsrStatus;
  slaDueAt: string;
  identityVerified: boolean;
  verificationMethod: string | null;
  createdAt: string;
  closedAt: string | null;
  resolution: Record<string, unknown> | null;
  nomineeRef: string | null;
  tokenHash: string;
  subject: string | null;
  bodyMd: string | null;
  contactEmail: string | null;
  contactMobile: string | null;
  language: string;
  verificationState: DsrVerificationState;
  alertsFired: string[];
}

// ─── In-memory store (fallback) ────────────────────────────────────────────

const memStore = new Map<string, DsrRecord>(); // id → record
const tokenIndex = new Map<string, string>(); // tokenHash → id

function dbDisabled(err: unknown): boolean {
  // Treat any connection-class failure as "fall back to memory". Same idiom
  // as the existing consents route.
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err);
  return (
    msg.includes("connect") ||
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("does not exist") ||
    msg.includes("relation") ||
    msg.includes("undefined")
  );
}

// ─── Public store API ──────────────────────────────────────────────────────

export async function insertDsr(input: Omit<DsrRecord, "id" | "createdAt"> & { id?: string }): Promise<DsrRecord> {
  const record: DsrRecord = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  try {
    // Lazy import so the route can run even if DB packages fail to load
    const { db, setTenantContext } = await import("@complianceos/db");
    const { dsrRequests } = await import("@complianceos/db/schema");
    await setTenantContext(record.tenantId);
    await db.insert(dsrRequests).values({
      id: record.id,
      tenantId: record.tenantId,
      dataPrincipalRef: record.dataPrincipalRef,
      requestType: record.requestType,
      channel: record.channel,
      status: record.status,
      slaDueAt: new Date(record.slaDueAt),
      identityVerified: record.identityVerified,
      verificationMethod: record.verificationMethod ?? undefined,
      closedAt: record.closedAt ? new Date(record.closedAt) : undefined,
      resolution: record.resolution,
      nomineeRef: record.nomineeRef ?? undefined,
      tokenHash: record.tokenHash,
      subject: record.subject ?? undefined,
      bodyMd: record.bodyMd ?? undefined,
      contactEmail: record.contactEmail ?? undefined,
      contactMobile: record.contactMobile ?? undefined,
      language: record.language,
      verificationState: record.verificationState,
      alertsFired: record.alertsFired,
    });
  } catch (err) {
    if (!dbDisabled(err)) throw err;
    // fall through to memory
  }

  memStore.set(record.id, record);
  tokenIndex.set(record.tokenHash, record.id);
  return record;
}

export async function findDsrByToken(tokenHash: string): Promise<DsrRecord | null> {
  try {
    const { db } = await import("@complianceos/db");
    const { dsrRequests } = await import("@complianceos/db/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db
      .select()
      .from(dsrRequests)
      .where(eq(dsrRequests.tokenHash, tokenHash))
      .limit(1);
    if (rows.length) return mapRow(rows[0]!);
  } catch (err) {
    if (!dbDisabled(err)) throw err;
  }
  const id = tokenIndex.get(tokenHash);
  return id ? (memStore.get(id) ?? null) : null;
}

export async function findDsrById(id: string, tenantId?: string): Promise<DsrRecord | null> {
  try {
    const { db, setTenantContext } = await import("@complianceos/db");
    const { dsrRequests } = await import("@complianceos/db/schema");
    const { eq } = await import("drizzle-orm");
    if (tenantId) await setTenantContext(tenantId);
    const rows = await db
      .select()
      .from(dsrRequests)
      .where(eq(dsrRequests.id, id))
      .limit(1);
    if (rows.length) return mapRow(rows[0]!);
  } catch (err) {
    if (!dbDisabled(err)) throw err;
  }
  return memStore.get(id) ?? null;
}

export async function listDsrByTenant(tenantId: string): Promise<DsrRecord[]> {
  try {
    const { db, setTenantContext } = await import("@complianceos/db");
    const { dsrRequests } = await import("@complianceos/db/schema");
    const { eq, desc } = await import("drizzle-orm");
    await setTenantContext(tenantId);
    const rows = await db
      .select()
      .from(dsrRequests)
      .where(eq(dsrRequests.tenantId, tenantId))
      .orderBy(desc(dsrRequests.createdAt));
    return rows.map(mapRow);
  } catch (err) {
    if (!dbDisabled(err)) throw err;
  }
  return [...memStore.values()]
    .filter((r) => r.tenantId === tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateDsr(
  id: string,
  patch: Partial<DsrRecord>,
  tenantId?: string,
): Promise<DsrRecord | null> {
  const existing = memStore.get(id) ?? (await findDsrById(id, tenantId));
  if (!existing) return null;
  const updated: DsrRecord = { ...existing, ...patch, id };

  try {
    const { db, setTenantContext } = await import("@complianceos/db");
    const { dsrRequests } = await import("@complianceos/db/schema");
    const { eq } = await import("drizzle-orm");
    await setTenantContext(updated.tenantId);
    await db
      .update(dsrRequests)
      .set({
        status: updated.status,
        identityVerified: updated.identityVerified,
        verificationMethod: updated.verificationMethod ?? undefined,
        closedAt: updated.closedAt ? new Date(updated.closedAt) : undefined,
        resolution: updated.resolution,
        nomineeRef: updated.nomineeRef ?? undefined,
        verificationState: updated.verificationState,
        alertsFired: updated.alertsFired,
      })
      .where(eq(dsrRequests.id, id));
  } catch (err) {
    if (!dbDisabled(err)) throw err;
  }

  memStore.set(updated.id, updated);
  tokenIndex.set(updated.tokenHash, updated.id);
  return updated;
}

// ─── Drizzle row → DsrRecord ───────────────────────────────────────────────

interface DrizzleDsrRow {
  id: string;
  tenantId: string;
  dataPrincipalRef: string;
  requestType: string;
  channel: string;
  status: string;
  slaDueAt: Date;
  identityVerified: boolean;
  verificationMethod: string | null;
  createdAt: Date;
  closedAt: Date | null;
  resolution: unknown;
  nomineeRef: string | null;
  tokenHash: string | null;
  subject: string | null;
  bodyMd: string | null;
  contactEmail: string | null;
  contactMobile: string | null;
  language: string | null;
  verificationState: unknown;
  alertsFired: string[] | null;
}

function mapRow(row: DrizzleDsrRow): DsrRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    dataPrincipalRef: row.dataPrincipalRef,
    requestType: row.requestType as DsrRequestType,
    channel: row.channel,
    status: row.status as DsrStatus,
    slaDueAt: row.slaDueAt.toISOString(),
    identityVerified: row.identityVerified,
    verificationMethod: row.verificationMethod,
    createdAt: row.createdAt.toISOString(),
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    resolution: (row.resolution as Record<string, unknown> | null) ?? null,
    nomineeRef: row.nomineeRef,
    tokenHash: row.tokenHash ?? "",
    subject: row.subject,
    bodyMd: row.bodyMd,
    contactEmail: row.contactEmail,
    contactMobile: row.contactMobile,
    language: row.language ?? "en",
    verificationState: (row.verificationState as DsrVerificationState) ?? {},
    alertsFired: row.alertsFired ?? [],
  };
}
