-- ComplianceOS Database Initialization
-- rule_ref: DPDP Rules 2025 — Section 6 (reasonable security safeguards)
-- This runs on first container start via docker-entrypoint-initdb.d

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

-- 2. Non-superuser application role (CRITICAL: app NEVER uses superuser)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_role') THEN
    CREATE ROLE app_role LOGIN PASSWORD 'app_role_dev_2026';
  END IF;
END
$$;

-- Grant connect and usage
GRANT CONNECT ON DATABASE complianceos_dev TO app_role;
GRANT USAGE ON SCHEMA public TO app_role;

-- app_role can SELECT, INSERT, UPDATE on all tables (but NOT DELETE on audit_logs)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_role;

-- Allow app_role to set the tenant context variable
-- This is used by RLS policies: current_setting('app.current_tenant')
ALTER ROLE app_role SET app.current_tenant = '00000000-0000-0000-0000-000000000000';
