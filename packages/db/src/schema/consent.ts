/**
 * ComplianceOS — Consent Management Schema
 * rule_ref: DPDP Act 2023, Section 6 (consent) + Rule 3 (notice)
 *
 * SHA-256 hash chain on consent_logs for tamper-evidence.
 * RLS on all tenant-scoped tables.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  bigserial,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./platform";

// ─── CONSENT PURPOSES ───────────────────────────────────────────────────────

export const consentPurposes = pgTable(
  "consent_purposes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    displayName: jsonb("display_name").notNull(), // { en: "...", hi: "..." }
    description: jsonb("description").notNull(),
    lawfulBasis: text("lawful_basis").notNull(), // consent | legitimate_use | employment | public_function | court_order | medical_emergency
    isEssential: boolean("is_essential").notNull().default(false),
    dataCategories: text("data_categories").array().notNull(),
    retentionDays: integer("retention_days").notNull(),
    ruleRefs: text("rule_refs")
      .array()
      .notNull()
      .default(["Rule 3", "Section 6"]),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("consent_purposes_tenant_code_idx").on(
      table.tenantId,
      table.code
    ),
  ]
);

// ─── CONSENTS (collected from data principals) ──────────────────────────────

export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    dataPrincipalRef: text("data_principal_ref").notNull(),
    noticeVersionId: uuid("notice_version_id").notNull(),
    language: text("language").notNull(),
    source: text("source").notNull(), // web | mobile | offline | imported | consent_manager_relay
    ipClass: text("ip_class"),
    userAgent: text("user_agent"),
    collectedAt: timestamp("collected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    artifact: jsonb("artifact").notNull(),
    artifactHash: text("artifact_hash").notNull(), // SHA-256
    artifactSignature: text("artifact_signature").notNull(),
  },
  (table) => [
    uniqueIndex("consents_tenant_principal_notice_idx").on(
      table.tenantId,
      table.dataPrincipalRef,
      table.noticeVersionId
    ),
    index("idx_consents_principal").on(
      table.tenantId,
      table.dataPrincipalRef
    ),
  ]
);

// ─── CONSENT RECORDS (per-purpose granularity) ──────────────────────────────

export const consentRecords = pgTable("consent_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  consentId: uuid("consent_id")
    .notNull()
    .references(() => consents.id, { onDelete: "cascade" }),
  purposeId: uuid("purpose_id")
    .notNull()
    .references(() => consentPurposes.id),
  granted: boolean("granted").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
});

// ─── CONSENT LOGS (hash-chained for tamper evidence) ────────────────────────

export const consentLogs = pgTable(
  "consent_logs",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    consentId: uuid("consent_id"),
    event: text("event").notNull(), // granted | withdrawn | modified | notice_updated
    payload: jsonb("payload").notNull(),
    prevHash: text("prev_hash").notNull(),
    rowHash: text("row_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_consent_logs_tenant_time").on(
      table.tenantId,
      table.createdAt
    ),
  ]
);
