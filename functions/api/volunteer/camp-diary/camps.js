import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const volunteerId = ctxData.volunteer.volunteerId;
  const supabase = createSupabaseAdmin(env);

  // Fetch activities of type 'camp' where volunteer is registered
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      event_id,
      activity:event_id (
        id,
        title,
        activity_date,
        activity_type
      )
    `)
    .eq('volunteer_id', volunteerId)
    .eq('status', 'registered');

  if (error) return errorResponse(error.message, 400);

  // Filter to ensure activity is indeed a camp type (case-insensitive or exact)
  const camps = (data || [])
    .map(row => row.activity)
    .filter(act => act && (act.activity_type === 'camp' || act.activity_type === 'national' || act.activity_type === 'social'));

  return jsonResponse({ camps });
}
