import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://complianceos:local_dev_password_2026@localhost:5432/complianceos_dev",
  },
  verbose: true,
  strict: true,
});
