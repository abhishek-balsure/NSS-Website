import { createSupabase, jsonResponse, errorResponse, signSessionPayload, setVolunteerCookieHeaders } from '../../_utils.js';

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

    // Fetch linked volunteer record
    const { data: volunteer } = await supabase
      .from('volunteers')
      .select('id, name, email, status, ref_code')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();

    if (!volunteer) return errorResponse('Volunteer profile not found', 404);

    const token = await signSessionPayload(
      { userId: data.user.id, email, volunteerId: volunteer.id, name: volunteer.name, exp: Math.floor(Date.now() / 1000) + 86400 },
      env.SESSION_SECRET
    );

    return new Response(JSON.stringify({ user: volunteer }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...setVolunteerCookieHeaders(token),
      },
    });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
