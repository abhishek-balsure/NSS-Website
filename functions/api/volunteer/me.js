import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

// Fields a volunteer may edit about themselves. Deliberately excludes
// identity-verifying fields (aadhar_no, dob, name, ref_code) — those
// require re-verification through the registration/admin process, not
// a self-service edit.
const EDITABLE_FIELDS = [
  'mobile_no', 'emergency_no', 'emergency_relation', 'address',
  'interest', 'tshirt_size', 'medical', 'blood_group', 'show_on_leaderboard',
];

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;
  const vid = ctxData.volunteer.volunteerId;
  const supabase = createSupabaseAdmin(env);

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);

  if (request.method === 'GET') {
    const { data, error } = await supabase.from('volunteers').select('*').eq('id', vid).single();
    if (error || !data) return errorResponse('Volunteer not found', 404);
    return jsonResponse({ user: data });
  }

  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      const update = {};
      for (const key of EDITABLE_FIELDS) {
        if (body[key] !== undefined) update[key] = body[key];
      }
      if (Object.keys(update).length === 0) {
        return errorResponse('No editable fields provided');
      }

      const { data, error } = await supabase.from('volunteers').update(update).eq('id', vid).select().single();
      if (error) return errorResponse(error.message, 400);
      return jsonResponse({ user: data });
    } catch (e) {
      return errorResponse(e.message, 500);
    }
  }

  return errorResponse('Method not allowed', 405);
}
