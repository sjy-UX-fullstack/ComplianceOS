/**
 * ComplianceOS — Billing, Documents, LMS, White-Label Schemas
 * rule_ref: DPDP Act 2023, Rule 3 (notice/documents)
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants, agencies } from "./platform";
import { users } from "./users";

// ─── DOCUMENT TEMPLATES ─────────────────────────────────────────────────────

export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").references(() => agencies.id),
  kind: text("kind").notNull(), // privacy_notice | cookie_policy | retention_policy | employee_policy | dpa | breach_playbook | dpia_template
  bodyMd: text("body_md").notNull(),
  language: text("language").notNull().default("en"),
  reviewedBy: text("reviewed_by"),
  ruleRefs: text("rule_refs").array(),
});

export const policies = pgTable("policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => documentTemplates.id),
  kind: text("kind").notNull(),
  currentVersion: integer("current_version").notNull().default(1),
  status: text("status").notNull().default("draft"),
});

export const policyVersions = pgTable("policy_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyId: uuid("policy_id")
    .notNull()
    .references(() => policies.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  bodyMd: text("body_md").notNull(),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  authorUserId: uuid("author_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── LMS ────────────────────────────────────────────────────────────────────

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").references(() => agencies.id),
  title: jsonb("title").notNull(), // { en: "...", hi: "..." }
  industry: text("industry"),
  language: text("language").notNull().default("en"),
});

export const courseModules = pgTable("course_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  title: jsonb("title").notNull(),
  bodyMd: text("body_md").notNull(),
  quiz: jsonb("quiz"),
});

export const courseCompletions = pgTable("course_completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id),
  score: integer("score"),
  certificateUrl: text("certificate_url"),
  completedAt: timestamp("completed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── BILLING ────────────────────────────────────────────────────────────────

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  displayName: text("display_name").notNull(),
  monthlyPriceInr: integer("monthly_price_inr").notNull(),
  yearlyPriceInr: integer("yearly_price_inr").notNull(),
  features: jsonb("features").notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  status: text("status").notNull().default("trialing"),
  currentPeriodEnd: timestamp("current_period_end", {
    withTimezone: true,
  }).notNull(),
  billingCycle: text("billing_cycle").notNull(), // monthly | yearly
  upiMandateId: text("upi_mandate_id"),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  number: text("number").unique().notNull(),
  amountInr: integer("amount_inr").notNull(),
  gstAmountInr: integer("gst_amount_inr").notNull(),
  status: text("status").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

// ─── WHITE-LABEL ────────────────────────────────────────────────────────────

export const agencyDomains = pgTable("agency_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agencies.id, { onDelete: "cascade" }),
  domain: text("domain").unique().notNull(),
  sslCertArn: text("ssl_cert_arn"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
});

export const tenantBranding = pgTable("tenant_branding", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  agencyId: uuid("agency_id").references(() => agencies.id),
  logoUrl: text("logo_url"),
  palette: jsonb("palette"),
  supportEmail: text("support_email"),
  privacySubdomain: text("privacy_subdomain"),
});
