import { defineConfig } from "drizzle-kit";
import path from "path";

const SUPABASE_FALLBACK =
  "postgresql://postgres:%40Ezihe__13579@db.dzpmxcjfjxjxjvpsokcf.supabase.co:5432/postgres";

const rawUrl = process.env.DATABASE_URL ?? SUPABASE_FALLBACK;
const url = rawUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "");

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url,
    ssl: { rejectUnauthorized: false },
  },
});
