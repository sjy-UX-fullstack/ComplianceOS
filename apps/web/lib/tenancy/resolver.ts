/**
 * ComplianceOS — Tenant Resolution Middleware
 * rule_ref: DPDP Rules 2025, Section 6 — tenant isolation
 *
 * Resolution order: subdomain → X-Tenant-Id header → JWT claim
 * MUST resolve tenant_id BEFORE any DB access.
 */

import { headers } from "next/headers";
import { db, setTenantContext } from "@complianceos/db";
import { tenants } from "@complianceos/db/schema";
import { eq } from "drizzle-orm";

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  agencyId?: string;
  plan: string;
  isSdf: boolean;
}

/**
 * Extract subdomain from the Host header.
 * e.g., "acme-d2c.complianceos.in" → "acme-d2c"
 * e.g., "acme-d2c.datashield.com" → "acme-d2c"
 */
function extractSubdomain(host: string): string | null {
  // Remove port
  const hostname = host.split(":")[0] ?? host;

  // Skip localhost for local dev
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  const parts = hostname.split(".");

  // Need at least 3 parts: subdomain.domain.tld
  if (parts.length >= 3) {
    return parts[0] ?? null;
  }

  return null;
}

/**
 * Resolve tenant from the current request context.
 *
 * Priority:
 * 1. Subdomain (e.g., acme-d2c.complianceos.in)
 * 2. X-Tenant-Id header
 * 3. JWT claim (future: from Clerk/WorkOS session)
 *
 * Sets `app.current_tenant` for RLS after resolution.
 */
export async function resolveTenant(): Promise<TenantContext | null> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const tenantIdHeader = headerList.get("x-tenant-id");

  let tenantSlug: string | null = null;
  let tenantId: string | null = null;

  // 1. Try subdomain
  const subdomain = extractSubdomain(host);
  if (subdomain) {
    tenantSlug = subdomain;
  }

  // 2. Try X-Tenant-Id header (for API calls)
  if (!tenantSlug && tenantIdHeader) {
    tenantId = tenantIdHeader;
  }

  // 3. Try query param for local dev
  if (!tenantSlug && !tenantId) {
    // In development, allow ?tenant=slug
    // This is stripped in production by Cloudflare
    return null;
  }

  // Lookup tenant
  let tenant;
  if (tenantSlug) {
    [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);
  } else if (tenantId) {
    [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
  }

  if (!tenant) {
    return null;
  }

  // Set RLS context — CRITICAL: must happen before any tenant-scoped query
  await setTenantContext(tenant.id);

  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    agencyId: tenant.agencyId ?? undefined,
    plan: tenant.plan,
    isSdf: tenant.isSdf,
  };
}

/**
 * Require tenant context — throws if not resolvable.
 * Use in all tenant-scoped API routes and server components.
 */
export async function requireTenant(): Promise<TenantContext> {
  const ctx = await resolveTenant();
  if (!ctx) {
    throw new Error("Tenant not found. Check subdomain or X-Tenant-Id header.");
  }
  return ctx;
}
