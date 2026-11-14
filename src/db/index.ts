import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

// Reuse one client across hot reloads in dev and across invocations in a warm serverless instance.
const globalForDb = globalThis as unknown as { __db?: Db };

/** Lazily create the DB client so `next build` doesn't need DATABASE_URL. */
export function getDb(): Db {
  if (globalForDb.__db) return globalForDb.__db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
  const client = postgres(url, {
    // Serverless: keep the pool tiny. prepare:false keeps us compatible with
    // transaction-mode poolers (Supabase/Neon pooled URLs).
    max: process.env.VERCEL ? 1 : 10,
    prepare: false,
  });
  globalForDb.__db = drizzle(client, { schema });
  return globalForDb.__db;
}

export { schema };
