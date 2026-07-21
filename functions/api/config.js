import { jsonResponse, errorResponse } from '../_utils.js';

// Public: hands the browser only the anon key (meant to be public — RLS
// is what actually protects data, not secrecy of this key). Needed
// client-side ONLY for the password-recovery page, which must talk to
// Supabase Auth directly to complete a reset link. No other page uses
// this — every other request in the app goes through our own backend.
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  return jsonResponse({
    supabaseUrl: env.SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
  });
}
