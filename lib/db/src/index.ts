import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const SUPABASE_FALLBACK =
  "postgresql://postgres:%40Ezihe__13579@db.dzpmxcjfjxjxjvpsokcf.supabase.co:5432/postgres";

const rawUrl = process.env.DATABASE_URL ?? SUPABASE_FALLBACK;

// Strip ?sslmode=... from the URL — we set ssl directly on the Pool config
// so pg-connection-string parsing never conflicts with our ssl object.
const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "");

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("[DB pool error]", err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
