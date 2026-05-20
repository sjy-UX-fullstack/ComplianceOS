/**
 * ComplianceOS — Platform & Tenant Schema
 * rule_ref: DPDP Rules 2025, Section 6 — reasonable security safeguards
 *
 * Hierarchy: Platform → Agency → Tenant → User
 * RLS enforced on all tenant-scoped tables via current_setting('app.current_tenant')
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── PLATFORM ADMINS ──────────────────────────────────────────────────────────

export const platformAdmins = pgTable("platform_admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(), // citext in raw SQL
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── AGENCIES (White-label consultant firms) ──────────────────────────────────

export const agencies = pgTable("agencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  primaryDomain: text("primary_domain"),
  brand: jsonb("brand").notNull().default({}),
  revSharePct: numeric("rev_share_pct", { precision: 5, scale: 2 })
    .notNull()
    .default("20.00"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── TENANTS (Client organizations) ──────────────────────────────────────────

export const ENTITY_TYPES = [
  "PvtLtd",
  "OPC",
  "LLP",
  "Partnership",
  "Proprietor",
  "Society",
  "Trust",
  "PublicLtd",
  "Other",
] as const;

export const PLAN_TYPES = [
  "free",
  "starter",
  "growth",
  "business",
  "enterprise",
  "agency",
] as const;

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").references(() => agencies.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  entityType: text("entity_type").notNull(), // validated via ENTITY_TYPES
  cin: text("cin"),
  pan: text("pan"),
  gstin: text("gstin"),
  industry: text("industry").notNull(),
  state: text("state"),
  isSdf: boolean("is_sdf").notNull().default(false),
  plan: text("plan").notNull().default("starter"),
  dataResidencyRegion: text("data_residency_region")
    .notNull()
    .default("ap-south-1"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
