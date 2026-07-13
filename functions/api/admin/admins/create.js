import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

// Super-admin only: create a new admin account (creates the Supabase Auth
// user AND the linked admins row in one step).
export async function onRequest(context) {
  const { request, env, data: ctxData } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  if (ctxData.admin.role !== 'super_admin') {
    return errorResponse('Only super admins can create admin accounts', 403);
  }

  try {
    const { email, password, name, role } = await request.json();
    if (!email || !password || !name) return errorResponse('email, password, and name are required');
    if (password.length < 8) return errorResponse('Password must be at least 8 characters');
    const finalRole = role === 'super_admin' ? 'super_admin' : 'admin';

    const supabase = createSupabaseAdmin(env);

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name, role: 'admin' },
    });
    if (authErr) return errorResponse(authErr.message, 400);

    const { data: newAdmin, error: dbErr } = await supabase.from('admins').insert({
      id: authData.user.id, email, name, role: finalRole,
    }).select().single();

    if (dbErr) {
      await supabase.auth.admin.deleteUser(authData.user.id); // rollback
      return errorResponse(dbErr.message, 400);
    }

    return jsonResponse({ admin: newAdmin }, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
