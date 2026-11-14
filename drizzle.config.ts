import { defineConfig } from "drizzle-kit";

// Load .env for local CLI use; on CI/hosting the variable is already set.
try {
  process.loadEnvFile(".env");
} catch {}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations need a direct connection; Neon's pooled (-pooler) URL is for the app.
  dbCredentials: { url: (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)! },
});
