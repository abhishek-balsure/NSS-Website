import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../../_utils.js';

// Who's registered / waitlisted / cancelled for one activity, with
// volunteer info joined. Activities ARE the events now — the separate
// "events" table was retired.
export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id, status, registered_at, volunteer:volunteer_id(id, name, email, ref_code, mobile_no)')
    .eq('event_id', params.id)
    .order('registered_at', { ascending: true });

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ registrations: data || [] });
}
