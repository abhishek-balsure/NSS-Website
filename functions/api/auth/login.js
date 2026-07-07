import { createSupabase, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const supabase = createSupabase(env);
    const { email, password } = await request.json();

    if (!email || !password) return errorResponse('Email and password required');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return errorResponse('Invalid credentials', 401);

    const { data: admin } = await supabase.from('admins').select('*').eq('id', data.user.id).single();
    if (!admin) return errorResponse('Not authorized as admin', 403);

    return jsonResponse({
      user: { id: data.user.id, email: data.user.email },
      admin: { name: admin.name, role: admin.role },
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
    });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
