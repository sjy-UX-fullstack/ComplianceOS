/**
 * ComplianceOS — Readiness Assessment Schema
 * rule_ref: DPDP Act 2023, Section 6 — compliance verification
 *
 * Models the 60-question compliance readiness assessment,
 * responses, and the resulting gap heatmap/90-day plan.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./platform";

// ─── ASSESSMENT QUESTIONS (Question Bank) ──────────────────────────────────

export const assessmentQuestions = pgTable("assessment_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(), // e.g. "consent_notice_present"
  category: text("category").notNull(), // consent | dsr | breach | vendor | security | ropa | lms
  questionText: jsonb("question_text").notNull(), // { en: "...", hi: "..." }
  description: jsonb("description").notNull(), // { en: "...", hi: "..." }
  options: jsonb("options").notNull(), // Array of { code: string, text: { en: string }, weight: number }
  ruleRefs: text("rule_refs").array().notNull(), // ["Rule 3", "Section 5"]
  industryOverlays: text("industry_overlays").array().notNull(), // ["fintech", "e-commerce"]
  version: integer("version").notNull().default(1),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── ASSESSMENTS (Run by tenants) ──────────────────────────────────────────

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("draft"), // draft | completed
    score: integer("score"), // Overall readiness score (0-100)
    industry: text("industry").notNull(), // The industry overlay context used
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_assessments_tenant_time").on(table.tenantId, table.createdAt),
  ]
);

// ─── ASSESSMENT RESPONSES ──────────────────────────────────────────────────

export const assessmentResponses = pgTable(
  "assessment_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => assessmentQuestions.id),
    selectedOptionCode: text("selected_option_code").notNull(),
    score: numeric("score", { precision: 3, scale: 2 }).notNull(), // weight from option (0.00 to 1.00)
    notes: text("notes"),
    evidenceUrl: text("evidence_url"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("responses_assessment_question_idx").on(
      table.assessmentId,
      table.questionId
    ),
  ]
);
