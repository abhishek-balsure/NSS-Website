import { createSupabaseAdmin, jsonResponse, errorResponse, signSessionPayload, setVolunteerCookieHeaders } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const { ref_code, name, email, mobile_no, password } = await request.json();

    if (!ref_code || !name || !email || !password) {
      return errorResponse('Reference code, name, email, and password are required');
    }

    const adminClient = createSupabaseAdmin(env);

    // Find the existing registration made via form.html — signup LINKS to it,
    // it never creates a brand new volunteers row (that row already has all
    // the required Aadhar/DOB/address fields filled in from registration).
    const { data: existingVolunteer, error: findErr } = await adminClient
      .from('volunteers')
      .select('id, auth_user_id, name, email, status')
      .eq('ref_code', ref_code.trim())
      .maybeSingle();

    if (findErr) return errorResponse(findErr.message, 400);
    if (!existingVolunteer) {
      return errorResponse('No registration found with that reference code. Please register first.', 404);
    }
    if (existingVolunteer.auth_user_id) {
      return errorResponse('This registration already has a login account. Try signing in instead.', 409);
    }

    // Check the email isn't already used by a different login account
    const { data: emailInUse } = await adminClient
      .from('volunteers')
      .select('id')
      .eq('email', email)
      .not('auth_user_id', 'is', null)
      .maybeSingle();
    if (emailInUse) return errorResponse('An account with this email already exists', 409);

    // Create auth user (auto-confirms — requires SUPABASE_SERVICE_KEY)
    const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'volunteer' },
    });

    if (authErr) return errorResponse(authErr.message, 400);

    // Link the login account to the existing registration row
    const { data: volunteer, error: linkErr } = await adminClient
      .from('volunteers')
      .update({
        auth_user_id: authData.user.id,
        mobile_no: mobile_no || undefined,
      })
      .eq('id', existingVolunteer.id)
      .select()
      .single();

    if (linkErr) {
      // Rollback auth user
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return errorResponse(linkErr.message, 400);
    }

    const token = await signSessionPayload(
      { userId: authData.user.id, email, volunteerId: volunteer.id, name: volunteer.name, exp: Math.floor(Date.now() / 1000) + 86400 },
      env.SESSION_SECRET
    );

    return new Response(JSON.stringify({ user: { id: volunteer.id, name: volunteer.name, email, status: volunteer.status } }), {
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