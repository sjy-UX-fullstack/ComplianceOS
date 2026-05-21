/**
 * ComplianceOS — Breach persistence (Sprint 5)
 *
 * Drizzle preferred, in-memory fallback when Postgres is unreachable.
 * Identical pattern to lib/dsr/store.ts — kept separate so we can evolve
 * incident-specific queries (ranked-by-due-at, evidence indexes) without
 * touching the DSR layer.
 */

import crypto from "node:crypto";
import type { BreachCategory, BreachSeverity, BreachStatus } from "./core";

export interface BreachEvidence {
  key: string;
  filename: string;
  sha256: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy?: string;
  note?: string;
}

export interface BreachAiClassification {
  severity: BreachSeverity;
  score: number;
  draftNarrative?: string;
  rootCauseHypothesis?: string;
  citations?: string[];
  modelUsed?: string;
}

export interface BreachContainmentStep {
  step: string;
  doneAt?: string;
  by?: string;
}

export interface BreachRecord {
  id: string;
  tenantId: string;
  refNo: string;
  detectedAt: string;
  reportedAt: string | null;
  certInDueAt: string | null;
  dpbDueAt: string | null;
  severity: BreachSeverity;
  category: BreachCategory;
  affectedCount: number | null;
  affectedCategories: string[];
  rootCause: string | null;
  status: BreachStatus;
  certInFiledAt: string | null;
  dpbInitialFiledAt: string | null;
  dpbDetailedFiledAt: string | null;
  notificationsSent: number;
  evidenceBucketPath: string | null;
  createdAt: string;

  // Sprint 5 additions
  title: string | null;
  narrative: string | null;
  discoveredVia: string | null;
  reporterUserId: string | null;
  containmentSteps: BreachContainmentStep[];
  sectoralOverlays: string[];
  customDueAts: Record<string, string>;
  evidence: BreachEvidence[];
  aiClassification: BreachAiClassification | null;
  alertsFired: string[];
}

const memStore = new Map<string, BreachRecord>();
const refIndex = new Map<string, string>();

function dbDisabled(err: unknown): boolean {
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

export async function insertBreach(
  input: Omit<BreachRecord, "id" | "createdAt"> & { id?: string },
): Promise<BreachRecord> {
  const record: BreachRecord = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  try {
    const { db, setTenantContext } = await import("@complianceos/db");
    const { breachIncidents } = await import("@complianceos/db/schema");
    await setTenantContext(record.tenantId);
    await db.insert(breachIncidents).values({
      id: record.id,
      tenantId: record.tenantId,
      refNo: record.refNo,
      detectedAt: new Date(record.detectedAt),
      reportedAt: record.reportedAt ? new Date(record.reportedAt) : undefined,
      certInDueAt: record.certInDueAt ? new Date(record.certInDueAt) : undefined,
      dpbDueAt: record.dpbDueAt ? new Date(record.dpbDueAt) : undefined,
      severity: record.severity,
      category: record.category,
      affectedCount: record.affectedCount ?? undefined,
      affectedCategories: record.affectedCategories,
      rootCause: record.rootCause ?? undefined,
      status: record.status,
      certInFiledAt: record.certInFiledAt ? new Date(record.certInFiledAt) : undefined,
      dpbInitialFiledAt: record.dpbInitialFiledAt ? new Date(record.dpbInitialFiledAt) : undefined,
      dpbDetailedFiledAt: record.dpbDetailedFiledAt ? new Date(record.dpbDetailedFiledAt) : undefined,
      notificationsSent: record.notificationsSent,
      evidenceBucketPath: record.evidenceBucketPath ?? undefined,
      title: record.title ?? undefined,
      narrative: record.narrative ?? undefined,
      discoveredVia: record.discoveredVia ?? undefined,
      reporterUserId: record.reporterUserId ?? undefined,
      containmentSteps: record.containmentSteps,
      sectoralOverlays: record.sectoralOverlays,
      customDueAts: record.customDueAts,
      evidence: record.evidence,
      aiClassification: record.aiClassification,
      alertsFired: record.alertsFired,
    });
  } catch (err) {
    if (!dbDisabled(err)) throw err;
  }
  memStore.set(record.id, record);
  refIndex.set(record.refNo, record.id);
  return record;
}

export async function findBreachById(
  id: string,
  tenantId?: string,
): Promise<BreachRecord | null> {
  try {
    const { db, setTenantContext } = await import("@complianceos/db");
    const { breachIncidents } = await import("@complianceos/db/schema");
    const { eq } = await import("drizzle-orm");
    if (tenantId) await setTenantContext(tenantId);
    const rows = await db
      .select()
      .from(breachIncidents)
      .where(eq(breachIncidents.id, id))
      .limit(1);
    if (rows.length) return mapRow(rows[0]!);
  } catch (err) {
    if (!dbDisabled(err)) throw err;
  }
  return memStore.get(id) ?? null;
}

export async function listBreachesByTenant(tenantId: string): Promise<BreachRecord[]> {
  try {
    const { db, setTenantContext } = await import("@complianceos/db");
    const { breachIncidents } = await import("@complianceos/db/schema");
    const { eq, desc } = await import("drizzle-orm");
    await setTenantContext(tenantId);
    const rows = await db
      .select()
      .from(breachIncidents)
      .where(eq(breachIncidents.tenantId, tenantId))
      .orderBy(desc(breachIncidents.detectedAt));
    return rows.map(mapRow);
  } catch (err) {
    if (!dbDisabled(err)) throw err;
  }
  return [...memStore.values()]
    .filter((r) => r.tenantId === tenantId)
    .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
}

export async function updateBreach(
  id: string,
  patch: Partial<BreachRecord>,
  tenantId?: string,
): Promise<BreachRecord | null> {
  const existing = memStore.get(id) ?? (await findBreachById(id, tenantId));
  if (!existing) return null;
  const updated: BreachRecord = { ...existing, ...patch, id };

  try {
    const { db, setTenantContext } = await import("@complianceos/db");
    const { breachIncidents } = await import("@complianceos/db/schema");
    const { eq } = await import("drizzle-orm");
    await setTenantContext(updated.tenantId);
    await db
      .update(breachIncidents)
      .set({
        severity: updated.severity,
        status: updated.status,
        affectedCount: updated.affectedCount ?? undefined,
        affectedCategories: updated.affectedCategories,
        rootCause: updated.rootCause ?? undefined,
        certInFiledAt: updated.certInFiledAt ? new Date(updated.certInFiledAt) : undefined,
        dpbInitialFiledAt: updated.dpbInitialFiledAt ? new Date(updated.dpbInitialFiledAt) : undefined,
        dpbDetailedFiledAt: updated.dpbDetailedFiledAt ? new Date(updated.dpbDetailedFiledAt) : undefined,
        notificationsSent: updated.notificationsSent,
        title: updated.title ?? undefined,
        narrative: updated.narrative ?? undefined,
        containmentSteps: updated.containmentSteps,
        sectoralOverlays: updated.sectoralOverlays,
        customDueAts: updated.customDueAts,
        evidence: updated.evidence,
        aiClassification: updated.aiClassification,
        alertsFired: updated.alertsFired,
      })
      .where(eq(breachIncidents.id, id));
  } catch (err) {
    if (!dbDisabled(err)) throw err;
  }

  memStore.set(updated.id, updated);
  refIndex.set(updated.refNo, updated.id);
  return updated;
}

// ─── Drizzle row → BreachRecord ────────────────────────────────────────────

interface DrizzleBreachRow {
  id: string;
  tenantId: string;
  refNo: string;
  detectedAt: Date;
  reportedAt: Date | null;
  certInDueAt: Date | null;
  dpbDueAt: Date | null;
  severity: string;
  category: string;
  affectedCount: number | null;
  affectedCategories: string[] | null;
  rootCause: string | null;
  status: string;
  certInFiledAt: Date | null;
  dpbInitialFiledAt: Date | null;
  dpbDetailedFiledAt: Date | null;
  notificationsSent: number;
  evidenceBucketPath: string | null;
  createdAt: Date;
  title: string | null;
  narrative: string | null;
  discoveredVia: string | null;
  reporterUserId: string | null;
  containmentSteps: unknown;
  sectoralOverlays: string[] | null;
  customDueAts: unknown;
  evidence: unknown;
  aiClassification: unknown;
  alertsFired: string[] | null;
}

function mapRow(row: DrizzleBreachRow): BreachRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    refNo: row.refNo,
    detectedAt: row.detectedAt.toISOString(),
    reportedAt: row.reportedAt ? row.reportedAt.toISOString() : null,
    certInDueAt: row.certInDueAt ? row.certInDueAt.toISOString() : null,
    dpbDueAt: row.dpbDueAt ? row.dpbDueAt.toISOString() : null,
    severity: row.severity as BreachSeverity,
    category: row.category as BreachCategory,
    affectedCount: row.affectedCount,
    affectedCategories: row.affectedCategories ?? [],
    rootCause: row.rootCause,
    status: row.status as BreachStatus,
    certInFiledAt: row.certInFiledAt ? row.certInFiledAt.toISOString() : null,
    dpbInitialFiledAt: row.dpbInitialFiledAt ? row.dpbInitialFiledAt.toISOString() : null,
    dpbDetailedFiledAt: row.dpbDetailedFiledAt ? row.dpbDetailedFiledAt.toISOString() : null,
    notificationsSent: row.notificationsSent,
    evidenceBucketPath: row.evidenceBucketPath,
    createdAt: row.createdAt.toISOString(),
    title: row.title,
    narrative: row.narrative,
    discoveredVia: row.discoveredVia,
    reporterUserId: row.reporterUserId,
    containmentSteps: (row.containmentSteps as BreachContainmentStep[]) ?? [],
    sectoralOverlays: row.sectoralOverlays ?? [],
    customDueAts: (row.customDueAts as Record<string, string>) ?? {},
    evidence: (row.evidence as BreachEvidence[]) ?? [],
    aiClassification: (row.aiClassification as BreachAiClassification) ?? null,
    alertsFired: row.alertsFired ?? [],
  };
}
