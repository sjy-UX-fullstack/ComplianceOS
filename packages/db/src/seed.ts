/**
 * ComplianceOS — Database Seed Script
 * Creates initial data: platform admin, agency, tenants, roles, plans.
 */

import { db } from "./client";
import {
  platformAdmins,
  agencies,
  tenants,
  users,
  roles,
  permissions,
  rolePermissions,
  memberships,
  plans,
  assessmentQuestions,
} from "./schema/index";
import { QUESTIONS_SEED } from "./data/questions";


const SYSTEM_ROLES = [
  "platform_admin",
  "agency_owner",
  "agency_admin",
  "consultant",
  "client_admin",
  "client_dpo",
  "client_user",
  "data_principal",
] as const;

const SYSTEM_PERMISSIONS = [
  // Consent module
  { resource: "consent", action: "read" },
  { resource: "consent", action: "create" },
  { resource: "consent", action: "update" },
  { resource: "consent", action: "delete" },
  // DSR module
  { resource: "dsr", action: "read" },
  { resource: "dsr", action: "create" },
  { resource: "dsr", action: "update" },
  { resource: "dsr", action: "assign" },
  // Breach module
  { resource: "breach", action: "read" },
  { resource: "breach", action: "create" },
  { resource: "breach", action: "update" },
  { resource: "breach", action: "file_report" },
  // Vendor module
  { resource: "vendor", action: "read" },
  { resource: "vendor", action: "create" },
  { resource: "vendor", action: "update" },
  // RoPA module
  { resource: "ropa", action: "read" },
  { resource: "ropa", action: "create" },
  { resource: "ropa", action: "update" },
  // Policy module
  { resource: "policy", action: "read" },
  { resource: "policy", action: "create" },
  { resource: "policy", action: "publish" },
  // Dashboard
  { resource: "dashboard", action: "read" },
  { resource: "dashboard", action: "export" },
  // Agency management
  { resource: "agency", action: "manage_clients" },
  { resource: "agency", action: "view_billing" },
  // Settings
  { resource: "settings", action: "read" },
  { resource: "settings", action: "update" },
  { resource: "settings", action: "manage_users" },
];

const PLAN_DATA = [
  {
    code: "free",
    displayName: "Free",
    monthlyPriceInr: 0,
    yearlyPriceInr: 0,
    features: {
      domains: 1,
      consents: 1000,
      dsrs: 3,
      modules: ["assessment", "consent", "policy"],
      poweredByBadge: true,
    },
  },
  {
    code: "starter",
    displayName: "Starter",
    monthlyPriceInr: 4999,
    yearlyPriceInr: 49990,
    features: {
      domains: 1,
      consents: 25000,
      dsrs: 5,
      modules: ["assessment", "consent", "policy", "dsr"],
      poweredByBadge: false,
    },
  },
  {
    code: "growth",
    displayName: "Growth",
    monthlyPriceInr: 14999,
    yearlyPriceInr: 149990,
    features: {
      domains: 5,
      consents: 250000,
      dsrs: 50,
      modules: [
        "assessment",
        "consent",
        "policy",
        "dsr",
        "vendor",
        "lms",
      ],
      poweredByBadge: false,
    },
  },
  {
    code: "business",
    displayName: "Business",
    monthlyPriceInr: 49999,
    yearlyPriceInr: 499990,
    features: {
      domains: -1, // unlimited
      consents: 2000000,
      dsrs: -1,
      modules: [
        "assessment",
        "consent",
        "policy",
        "dsr",
        "vendor",
        "lms",
        "dpia",
        "breach",
        "ropa",
      ],
      sso: true,
      auditExport: true,
      poweredByBadge: false,
    },
  },
  {
    code: "enterprise",
    displayName: "Enterprise / SDF",
    monthlyPriceInr: 200000,
    yearlyPriceInr: 2000000,
    features: {
      domains: -1,
      consents: -1,
      dsrs: -1,
      modules: ["all"],
      dedicatedDb: true,
      dpoWorkspace: true,
      algorithmicDueDiligence: true,
      support247: true,
      poweredByBadge: false,
    },
  },
  {
    code: "agency",
    displayName: "Agency / Consultant",
    monthlyPriceInr: 19999,
    yearlyPriceInr: 199990,
    features: {
      domains: -1,
      consents: -1,
      dsrs: -1,
      modules: ["all"],
      perClientMonthly: 999,
      revSharePct: 20,
      whiteLabel: true,
      poweredByBadge: false,
    },
  },
];

async function seed() {
  console.log("🌱 Seeding ComplianceOS database...\n");

  // 1. Platform Admin
  console.log("  → Creating platform admin...");
  const [admin] = await db
    .insert(platformAdmins)
    .values({
      email: "admin@complianceos.in",
      fullName: "ComplianceOS Platform Admin",
    })
    .onConflictDoNothing()
    .returning();

  // 2. Demo Agency
  console.log("  → Creating demo agency...");
  const [agency] = await db
    .insert(agencies)
    .values({
      name: "DataShield Consulting",
      slug: "datashield",
      primaryDomain: "datashield.complianceos.in",
      brand: {
        primaryColor: "#1E40AF",
        secondaryColor: "#3B82F6",
        companyName: "DataShield Consulting",
      },
      revSharePct: "20.00",
    })
    .onConflictDoNothing()
    .returning();

  // 3. Demo Tenants (Tenant A and B for cross-tenant testing)
  console.log("  → Creating demo tenants...");
  const [tenantA] = await db
    .insert(tenants)
    .values({
      agencyId: agency?.id,
      name: "Acme D2C Pvt Ltd",
      slug: "acme-d2c",
      entityType: "PvtLtd",
      industry: "e-commerce",
      state: "Karnataka",
      plan: "growth",
    })
    .onConflictDoNothing()
    .returning();

  const [tenantB] = await db
    .insert(tenants)
    .values({
      name: "BetaFintech LLP",
      slug: "betafintech",
      entityType: "LLP",
      industry: "fintech",
      state: "Maharashtra",
      plan: "business",
    })
    .onConflictDoNothing()
    .returning();

  // 4. Plans
  console.log("  → Creating pricing plans...");
  for (const plan of PLAN_DATA) {
    await db.insert(plans).values(plan).onConflictDoNothing();
  }

  // 5. Permissions
  console.log("  → Creating permissions...");
  const insertedPermissions: { id: string; resource: string; action: string }[] = [];
  for (const perm of SYSTEM_PERMISSIONS) {
    const [inserted] = await db
      .insert(permissions)
      .values(perm)
      .onConflictDoNothing()
      .returning();
    if (inserted) insertedPermissions.push(inserted);
  }

  // 6. System Roles for each tenant
  if (tenantA) {
    console.log("  → Creating system roles for Tenant A...");
    for (const roleName of SYSTEM_ROLES) {
      await db
        .insert(roles)
        .values({
          tenantId: tenantA.id,
          name: roleName,
          isSystem: true,
        })
        .onConflictDoNothing();
    }
  }

  if (tenantB) {
    console.log("  → Creating system roles for Tenant B...");
    for (const roleName of SYSTEM_ROLES) {
      await db
        .insert(roles)
        .values({
          tenantId: tenantB.id,
          name: roleName,
          isSystem: true,
        })
        .onConflictDoNothing();
    }
  }

  // 7. Assessment Questions
  console.log("  → Seeding assessment questions...");
  for (const q of QUESTIONS_SEED) {
    await db
      .insert(assessmentQuestions)
      .values({
        code: q.code,
        category: q.category,
        questionText: q.questionText,
        description: q.description,
        options: q.options,
        ruleRefs: q.ruleRefs,
        industryOverlays: q.industryOverlays,
      })
      .onConflictDoNothing();
  }

  console.log("\n✅ Seed complete!");

  console.log(`   Platform Admin: admin@complianceos.in`);
  console.log(`   Agency: DataShield Consulting (datashield)`);
  console.log(`   Tenant A: Acme D2C Pvt Ltd (acme-d2c) — Growth plan`);
  console.log(`   Tenant B: BetaFintech LLP (betafintech) — Business plan`);
  console.log(`   Plans: ${PLAN_DATA.length} tiers created`);
  console.log(`   Permissions: ${insertedPermissions.length} created`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
