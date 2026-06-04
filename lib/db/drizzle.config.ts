import { defineConfig } from "drizzle-kit";
  import path from "path";

  const rawUrl =
    process.env.DATABASE_URL ??
    "postgresql://postgres:%40Ezihe__13579@db.dzpmxcjfjxjxjvpsokcf.supabase.co:5432/postgres";

  const url = rawUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "");

  export default defineConfig({
    schema: path.join(__dirname, "./src/schema/index.ts"),
    dialect: "postgresql",
    dbCredentials: {
      url,
      ssl: true,
    },
  });
  