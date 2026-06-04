import { drizzle } from "drizzle-orm/node-postgres";
  import pg from "pg";
  import * as schema from "./schema";

  const { Pool } = pg;

  const rawUrl =
    process.env.DATABASE_URL ??
    "postgresql://postgres:%40Ezihe__13579@db.dzpmxcjfjxjxjvpsokcf.supabase.co:5432/postgres";

  // Strip sslmode from connection string — set SSL options directly on Pool
  // so pg-connection-string parsing cannot conflict with them
  const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "");

  export const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (err) => {
    console.error("Unexpected DB pool error:", err.message);
  });

  export const db = drizzle(pool, { schema });

  export * from "./schema";
  