/**
 * ComplianceOS — Database Client
 *
 * Provides a configured Drizzle ORM instance connected to PostgreSQL.
 * Uses the `postgres` driver (postgres.js) for best performance.
 *
 * CRITICAL: Every request MUST call `setTenantContext(tenantId)` before
 * executing any query. This sets `app.current_tenant` for RLS.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://complianceos:local_dev_password_2026@localhost:5432/complianceos_dev";

// Connection pool for the application
const queryClient = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

/**
 * Set the tenant context for RLS isolation.
 * MUST be called at the start of every request before any DB query.
 *
 * @param tenantId - UUID of the current tenant
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  await queryClient`SELECT set_config('app.current_tenant', ${tenantId}, false)`;
}

/**
 * Clear the tenant context (for cleanup / testing).
 */
export async function clearTenantContext(): Promise<void> {
  await queryClient`SELECT set_config('app.current_tenant', '00000000-0000-0000-0000-000000000000', false)`;
}

export { queryClient };
export type Database = typeof db;
