/**
 * ComplianceOS — Users & RBAC Schema
 * rule_ref: DPDP Rules 2025, Section 6
 *
 * Roles: platform_admin, agency_owner, agency_admin, consultant,
 *        client_admin, client_dpo, client_user, data_principal
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants, agencies } from "./platform";

// ─── SUPPORTED LANGUAGES (22 Scheduled + English) ────────────────────────────

export const SUPPORTED_LANGUAGES = [
  "en",
  "hi",
  "bn",
  "te",
  "mr",
  "ta",
  "ur",
  "gu",
  "kn",
  "or",
  "ml",
  "pa",
  "as",
  "mai",
  "sd",
  "sa",
  "ne",
  "kok",
  "doi",
  "mni",
  "sat",
  "ks",
  "brx",
] as const;

// ─── USERS ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").unique(),
  email: text("email").unique().notNull(), // citext in raw SQL
  fullName: text("full_name"),
  phone: text("phone"),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── ROLES ───────────────────────────────────────────────────────────────────

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isSystem: boolean("is_system").notNull().default(false),
  },
  (table) => [uniqueIndex("roles_tenant_name_idx").on(table.tenantId, table.name)]
);

// ─── PERMISSIONS ─────────────────────────────────────────────────────────────

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resource: text("resource").notNull(),
    action: text("action").notNull(),
  },
  (table) => [uniqueIndex("permissions_resource_action_idx").on(table.resource, table.action)]
);

// ─── ROLE ↔ PERMISSION ──────────────────────────────────────────────────────

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    {
      pk: uniqueIndex("role_permissions_pk").on(table.roleId, table.permissionId),
    },
  ]
);

// ─── MEMBERSHIPS (User ↔ Tenant ↔ Role binding) ─────────────────────────────

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    agencyId: uuid("agency_id").references(() => agencies.id),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    attributes: jsonb("attributes").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("memberships_user_tenant_idx").on(table.userId, table.tenantId)]
);
