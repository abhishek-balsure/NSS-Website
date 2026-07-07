import { createSupabase, jsonResponse, errorResponse, signSessionPayload, setAdminCookieHeaders } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const supabase = createSupabase(env);
    const { email, password } = await request.json();

    if (!email || !password) return errorResponse('Email and password required');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return errorResponse('Invalid email or password', 401);

    const { data: admin } = await supabase.from('admins').select('id, email, name, role').eq('id', data.user.id).single();
    if (!admin) {
      await supabase.auth.signOut();
      return errorResponse('Not authorized as admin', 403);
    }

    const token = await signSessionPayload(
      { userId: admin.id, email: admin.email, name: admin.name, role: admin.role, exp: Math.floor(Date.now() / 1000) + 86400 },
      env.SESSION_SECRET
    );

    return new Response(JSON.stringify({ user: admin }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...setAdminCookieHeaders(token),
      },
    });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
