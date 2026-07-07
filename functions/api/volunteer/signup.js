import { createSupabaseAdmin, jsonResponse, errorResponse, signSessionPayload, setVolunteerCookieHeaders } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const { name, email, mobile_no, password } = await request.json();

    if (!name || !email || !password) {
      return errorResponse('Name, email, and password are required');
    }

    const adminClient = createSupabaseAdmin(env);

    // Check duplicate email
    const { data: existing } = await adminClient.from('volunteers').select('id').eq('email', email).maybeSingle();
    if (existing) return errorResponse('An account with this email already exists', 409);

    // Create auth user (auto-confirms — requires SUPABASE_SERVICE_KEY)
    const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'volunteer' },
    });

    if (authErr) return errorResponse(authErr.message, 400);

    // Create volunteer record linked to auth user
    const { data: volunteer, error: volErr } = await adminClient.from('volunteers').insert({
      auth_user_id: authData.user.id,
      name,
      email,
      mobile_no: mobile_no || '',
      status: 'pending',
    }).select().single();

    if (volErr) {
      // Rollback auth user
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return errorResponse(volErr.message, 400);
    }

    const token = await signSessionPayload(
      { userId: authData.user.id, email, volunteerId: volunteer.id, name, exp: Math.floor(Date.now() / 1000) + 86400 },
      env.SESSION_SECRET
    );

    return new Response(JSON.stringify({ user: { id: volunteer.id, name, email, status: volunteer.status } }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...setVolunteerCookieHeaders(token),
      },
    });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
