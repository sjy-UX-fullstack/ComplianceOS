/**
 * ComplianceOS — Audit Trail Service
 * rule_ref: DPDP Rules 2025, Section 6 — reasonable security safeguards
 *
 * Implements HMAC-SHA256 chained hash for tamper-evident audit logging.
 * Every state-changing operation MUST call `writeAuditLog()`.
 */

import { createHmac } from "node:crypto";
import { db } from "./client";
import { auditLogs } from "./schema/audit";
import { desc, eq, sql } from "drizzle-orm";

const AUDIT_SECRET =
  process.env.AUDIT_HMAC_SECRET ?? "dev-audit-secret-change-in-production";

interface AuditEntry {
  tenantId?: string;
  agencyId?: string;
  actorUserId?: string;
  actorType: "user" | "system" | "api_key" | "webhook";
  action: string;
  resourceType: string;
  resourceId?: string;
  payload: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/**
 * Canonicalize payload for deterministic hashing.
 * Sorts keys recursively to ensure consistent hash regardless of insertion order.
 */
function canonicalize(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

/**
 * Compute HMAC-SHA256 hash for an audit log entry.
 */
function computeRowHash(
  prevHash: string,
  payload: Record<string, unknown>,
  metadata: Record<string, unknown>
): string {
  const data = prevHash + canonicalize(payload) + canonicalize(metadata);
  return createHmac("sha256", AUDIT_SECRET).update(data).digest("hex");
}

/**
 * Get the hash of the most recent audit log entry.
 * Returns genesis hash if no entries exist.
 */
async function getLastHash(): Promise<string> {
  const result = await db
    .select({ rowHash: auditLogs.rowHash })
    .from(auditLogs)
    .orderBy(desc(auditLogs.id))
    .limit(1);

  if (result.length === 0) {
    // Genesis hash
    return createHmac("sha256", AUDIT_SECRET)
      .update("COMPLIANCEOS_GENESIS_BLOCK")
      .digest("hex");
  }

  return result[0]!.rowHash;
}

/**
 * Write a tamper-evident audit log entry.
 * The row_hash chains from the previous entry's hash, making any
 * tampering detectable by walking the chain.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<bigint> {
  const prevHash = await getLastHash();

  const metadata = {
    tenantId: entry.tenantId ?? null,
    agencyId: entry.agencyId ?? null,
    actorUserId: entry.actorUserId ?? null,
    actorType: entry.actorType,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId ?? null,
    timestamp: new Date().toISOString(),
  };

  const rowHash = computeRowHash(prevHash, entry.payload, metadata);

  const [inserted] = await db
    .insert(auditLogs)
    .values({
      tenantId: entry.tenantId,
      agencyId: entry.agencyId,
      actorUserId: entry.actorUserId,
      actorType: entry.actorType,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      payload: entry.payload,
      ip: entry.ip,
      userAgent: entry.userAgent,
      prevHash,
      rowHash,
    })
    .returning({ id: auditLogs.id });

  return inserted!.id;
}

/**
 * Verify the entire audit log hash chain.
 * Returns { valid: true } if chain is intact, or { valid: false, brokenAtId }
 * if tampering is detected.
 */
export async function verifyAuditChain(): Promise<{
  valid: boolean;
  totalEntries: number;
  brokenAtId?: bigint;
}> {
  const entries = await db
    .select()
    .from(auditLogs)
    .orderBy(auditLogs.id);

  if (entries.length === 0) {
    return { valid: true, totalEntries: 0 };
  }

  // Verify genesis
  const genesisHash = createHmac("sha256", AUDIT_SECRET)
    .update("COMPLIANCEOS_GENESIS_BLOCK")
    .digest("hex");

  let expectedPrevHash = genesisHash;

  for (const entry of entries) {
    // Check prev_hash matches expected
    if (entry.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenAtId: entry.id,
      };
    }

    // Recompute row_hash
    const metadata = {
      tenantId: entry.tenantId ?? null,
      agencyId: entry.agencyId ?? null,
      actorUserId: entry.actorUserId ?? null,
      actorType: entry.actorType,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? null,
      timestamp: entry.createdAt.toISOString(),
    };

    const recomputedHash = computeRowHash(
      entry.prevHash,
      entry.payload as Record<string, unknown>,
      metadata
    );

    if (entry.rowHash !== recomputedHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenAtId: entry.id,
      };
    }

    expectedPrevHash = entry.rowHash;
  }

  return { valid: true, totalEntries: entries.length };
}

export { computeRowHash, canonicalize, getLastHash };
