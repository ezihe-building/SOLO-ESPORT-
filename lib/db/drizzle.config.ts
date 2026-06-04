import { defineConfig } from "drizzle-kit";
import path from "path";

// Fallback to hardcoded Supabase URL if DATABASE_URL not set.
// ?sslmode=require is needed for drizzle-kit — it uses the pg driver directly.
// At runtime (lib/db/src/index.ts), sslmode is stripped and ssl: { rejectUnauthorized: false }
// is passed directly on the Pool object instead, which is more reliable.
const SUPABASE_FALLBACK =
  "postgresql://postgres:%40Ezihe__13579@db.dzpmxcjfjxjxjvpsokcf.supabase.co:5432/postgres?sslmode=require";

const url = process.env.DATABASE_URL ?? SUPABASE_FALLBACK;

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: { url },
});
