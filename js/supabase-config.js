// ──────────────────────────────────────────────
// Supabase Client Config
// ──────────────────────────────────────────────
// Replace these with YOUR Supabase project values:
// Dashboard > Project > Settings > API
// ──────────────────────────────────────────────

const SUPABASE_URL = 'https://your-project-id.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key-here'

// Initialize the Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
