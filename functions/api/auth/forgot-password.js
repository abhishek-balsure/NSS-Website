import { createSupabase, jsonResponse, errorResponse, checkRateLimit } from '../../_utils.js';

// Shared by both volunteer and admin login pages — Supabase Auth is the
// same underlying user store for both, only the app-level admins/volunteers
// tables differ. One reset flow works for both roles.
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const { email } = await request.json();
    if (!email) return errorResponse('Email is required');

    const rlKey = `pwreset:${email.trim().toLowerCase()}`;
    const rl = await checkRateLimit(env, rlKey, 3, 600); // 3 per 10 minutes
    if (!rl.allowed) {
      return errorResponse(`Too many reset requests. Try again in ${rl.retryAfterSeconds} seconds.`, 429);
    }

    const supabase = createSupabase(env);
    const redirectTo = new URL('/reset-password.html', request.url).toString();

    // Always return the same success message whether or not the email
    // exists — an "email not found" response would let anyone probe
    // which addresses have accounts.
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    return jsonResponse({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
