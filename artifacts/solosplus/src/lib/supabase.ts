import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dzpmxcjfjxjxjvpsokcf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TuAAGSAiy3BwWXMdwbfD3A_z_-XMR-9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
