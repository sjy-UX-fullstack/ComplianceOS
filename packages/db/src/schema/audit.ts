/**
 * ComplianceOS — Tamper-Evident Audit Log Schema
 * rule_ref: DPDP Rules 2025, Section 6 — reasonable security safeguards
 *
 * Every state-changing operation writes here with HMAC-SHA256 chained hash.
 * Daily Merkle root anchored via OpenTimestamps.
 * NO UPDATE or DELETE permitted on audit_logs.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  bigserial,
  bigint,
  inet,
  index,
} from "drizzle-orm/pg-core";

// ─── AUDIT LOGS (append-only, hash-chained) ─────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    tenantId: uuid("tenant_id"),
    agencyId: uuid("agency_id"),
    actorUserId: uuid("actor_user_id"),
    actorType: text("actor_type").notNull(), // 'user' | 'system' | 'api_key' | 'webhook'
    action: text("action").notNull(), // 'consent.granted', 'dsr.created', etc.
    resourceType: text("resource_type").notNull(), // 'consent', 'dsr_request', etc.
    resourceId: text("resource_id"),
    payload: jsonb("payload").notNull(),
    ip: inet("ip"),
    userAgent: text("user_agent"),
    prevHash: text("prev_hash").notNull(), // previous row's row_hash
    rowHash: text("row_hash").notNull(), // HMAC-SHA256(secret, prev_hash || canonical(payload))
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_audit_tenant_time").on(table.tenantId, table.createdAt),
  ]
);

// ─── AUDIT ANCHORS (daily Merkle root) ──────────────────────────────────────

export const auditAnchors = pgTable("audit_anchors", {
  id: uuid("id").primaryKey().defaultRandom(),
  anchoredAt: timestamp("anchored_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  merkleRoot: text("merkle_root").notNull(),
  externalRef: text("external_ref"), // OpenTimestamps proof reference
  rangeStartId: bigint("range_start_id", { mode: "bigint" }).notNull(),
  rangeEndId: bigint("range_end_id", { mode: "bigint" }).notNull(),
});
