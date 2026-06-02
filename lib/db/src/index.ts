import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:%40Ezihe__13579@db.dzpmxcjfjxjxjvpsokcf.supabase.co:5432/postgres?sslmode=require";

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema";
