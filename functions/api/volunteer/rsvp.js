import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

// Volunteer marks yes/no attendance intent for an upcoming activity.
export async function onRequest(context) {
  const { request, env, data: ctxData } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const { activity_id, response } = await request.json();
    if (!activity_id || !['yes', 'no'].includes(response)) {
      return errorResponse('activity_id and response ("yes" or "no") are required');
    }

    const supabase = createSupabaseAdmin(env);
    const vid = ctxData.volunteer.volunteerId;

    const { data: act, error: actErr } = await supabase
      .from('activities').select('id, status').eq('id', activity_id).single();
    if (actErr || !act) return errorResponse('Activity not found', 404);
    if (act.status === 'completed' || act.status === 'cancelled') {
      return errorResponse('This activity is no longer open for RSVPs');
    }

    const { data: rsvp, error } = await supabase
      .from('activity_rsvps')
      .upsert({ volunteer_id: vid, activity_id, response }, { onConflict: 'volunteer_id,activity_id' })
      .select()
      .single();

    if (error) return errorResponse(error.message, 400);
    return jsonResponse({ rsvp });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
