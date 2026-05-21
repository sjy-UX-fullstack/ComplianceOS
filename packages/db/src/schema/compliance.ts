/**
 * ComplianceOS — Data Inventory (RoPA), DSR, Breach, Vendor Schemas
 * rule_ref: DPDP Act 2023, Rules 7, 8, 13, 14, 15
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./platform";
import { users } from "./users";

// ─── PROCESSING ACTIVITIES (RoPA) ──────────────────────────────────────────
// rule_ref: Rule 8 (retention), Rule 13(4) (SDF traffic data), Rule 15 (cross-border)

export const processingActivities = pgTable("processing_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  purpose: text("purpose").notNull(),
  lawfulBasis: text("lawful_basis").notNull(),
  dataCategories: text("data_categories").array().notNull(),
  dataPrincipalCategories: text("data_principal_categories").array().notNull(),
  recipients: text("recipients").array(),
  crossBorderDestinations: text("cross_border_destinations").array(),
  retentionPolicy: text("retention_policy").notNull(),
  securityMeasures: text("security_measures").array(),
  dpiaRequired: boolean("dpia_required").notNull().default(false),
  isTrafficData: boolean("is_traffic_data").notNull().default(false),
  ownerUserId: uuid("owner_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── DATA ASSETS ────────────────────────────────────────────────────────────

export const dataAssets = pgTable("data_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(), // database | table | file_store | saas | endpoint | api | crm | erp | tally | zoho_books
  location: text("location"),
  hostingRegion: text("hosting_region").notNull().default("ap-south-1"),
  sensitivity: text("sensitivity").notNull().default("standard"),
  discoveredAt: timestamp("discovered_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── DATA FLOWS ─────────────────────────────────────────────────────────────

export const dataFlows = pgTable("data_flows", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  sourceAssetId: uuid("source_asset_id").references(() => dataAssets.id),
  destinationAssetId: uuid("destination_asset_id").references(
    () => dataAssets.id
  ),
  isCrossBorder: boolean("is_cross_border").notNull().default(false),
  destinationCountry: text("destination_country"),
  activityId: uuid("activity_id").references(() => processingActivities.id),
});

// ─── DSR REQUESTS ───────────────────────────────────────────────────────────
// rule_ref: Rule 14(3) — 90-day SLA

export const dsrRequests = pgTable(
  "dsr_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    dataPrincipalRef: text("data_principal_ref").notNull(),
    requestType: text("request_type").notNull(), // access | correction | erasure | nomination | grievance | withdrawal
    channel: text("channel").notNull(), // web | email | whatsapp | phone | offline
    status: text("status").notNull().default("received"),
    slaDueAt: timestamp("sla_due_at", { withTimezone: true }).notNull(),
    identityVerified: boolean("identity_verified").notNull().default(false),
    verificationMethod: text("verification_method"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    resolution: jsonb("resolution"),
    nomineeRef: text("nominee_ref"),

    // ─── Sprint 4 additions ────────────────────────────────────────────────
    // SHA-256 hash of the magic-link status token. Plain token never persists.
    tokenHash: text("token_hash").unique(),
    // Free-text subject + body (requester's own words)
    subject: text("subject"),
    bodyMd: text("body_md"),
    // Requester contact (used for OTP + WhatsApp + email status updates)
    contactEmail: text("contact_email"),
    contactMobile: text("contact_mobile"),
    language: text("language").default("en"),
    // Transient identity-verification state (otp hashes, attempts, expiries,
    // Setu DigiLocker refs). Stored as JSONB to avoid table proliferation.
    verificationState: jsonb("verification_state"),
    // SLA alert tracking: which T-N notifications have fired
    alertsFired: text("alerts_fired").array().default([]),
  },
  (table) => [
    index("idx_dsr_sla").on(table.tenantId, table.status, table.slaDueAt),
    index("idx_dsr_token").on(table.tokenHash),
  ]
);

// ─── BREACH INCIDENTS ───────────────────────────────────────────────────────
// rule_ref: Rule 7(2) — 72h DPB report; CERT-In 6h report

export const breachIncidents = pgTable(
  "breach_incidents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    refNo: text("ref_no").unique().notNull(),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
    reportedAt: timestamp("reported_at", { withTimezone: true }).defaultNow(),
    certInDueAt: timestamp("cert_in_due_at", { withTimezone: true }), // detected_at + 6h
    dpbDueAt: timestamp("dpb_due_at", { withTimezone: true }), // detected_at + 72h
    severity: text("severity").notNull(), // low | medium | high | critical
    category: text("category").notNull(),
    affectedCount: integer("affected_count"),
    affectedCategories: text("affected_categories").array(),
    rootCause: text("root_cause"),
    status: text("status").notNull().default("open"),
    certInFiledAt: timestamp("cert_in_filed_at", { withTimezone: true }),
    dpbInitialFiledAt: timestamp("dpb_initial_filed_at", { withTimezone: true }),
    dpbDetailedFiledAt: timestamp("dpb_detailed_filed_at", {
      withTimezone: true,
    }),
    notificationsSent: integer("notifications_sent").notNull().default(0),
    evidenceBucketPath: text("evidence_bucket_path"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // ─── Sprint 5 additions ────────────────────────────────────────────────
    // Human-readable title + DPO narrative
    title: text("title"),
    narrative: text("narrative"),
    discoveredVia: text("discovered_via"), // siem | user_report | partner | press | other
    reporterUserId: uuid("reporter_user_id"),
    containmentSteps: jsonb("containment_steps"), // { step: string; doneAt?: iso }[]
    // Sectoral regulator overlays — RBI 2h/6h, IRDAI 72h, TRAI etc.
    sectoralOverlays: text("sectoral_overlays").array().default([]),
    customDueAts: jsonb("custom_due_ats"), // { rbi_2h?: iso, rbi_6h?: iso, irdai?: iso }
    // Evidence locker — S3 Object Lock pointers (7yr WORM)
    evidence: jsonb("evidence"), // { key, sha256, sizeBytes, uploadedAt }[]
    // AI assists
    aiClassification: jsonb("ai_classification"),
    // SLA alert tracking (T-30m / T-1h fired for CERT-In, T-24h/T-1h for DPB)
    alertsFired: text("alerts_fired").array().default([]),
  },
  (table) => [
    index("idx_breach_status").on(table.tenantId, table.status, table.detectedAt),
    index("idx_breach_certin_due").on(table.certInDueAt),
    index("idx_breach_dpb_due").on(table.dpbDueAt),
  ]
);

// ─── VENDORS ────────────────────────────────────────────────────────────────
// rule_ref: Rule 15 (cross-border), Rule 13(4) (SDF traffic data)

export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  countryOfIncorporation: text("country_of_incorporation").notNull(),
  isProcessor: boolean("is_processor").notNull().default(true),
  dataCategoriesShared: text("data_categories_shared").array().notNull(),
  riskScore: integer("risk_score"),
  lastAssessedAt: timestamp("last_assessed_at", { withTimezone: true }),
  certs: jsonb("certs"),
});

export const dpas = pgTable("dpas", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  templateId: uuid("template_id"),
  s3Key: text("s3_key").notNull(),
});

export const vendorAssessments = pgTable("vendor_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  questionnaire: jsonb("questionnaire").notNull(),
  inherentScore: integer("inherent_score"),
  residualScore: integer("residual_score"),
  reviewerUserId: uuid("reviewer_user_id"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});
