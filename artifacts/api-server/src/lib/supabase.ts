import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "https://dzpmxcjfjxjxjvpsokcf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseServiceKey) {
  console.warn("[supabase] SUPABASE_SERVICE_ROLE_KEY not set — auth endpoints will return 500");
}

// Lazy singleton — avoids throwing at module load when the key is missing.
// On Render the env var IS set so this will work correctly in production.
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseServiceKey;
    if (!key) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for auth operations");
    }
    _client = createClient(supabaseUrl, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});
