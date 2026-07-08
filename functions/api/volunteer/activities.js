import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

// Upcoming activities + this volunteer's own RSVP status for each (if any).
export async function onRequest(context) {
  const { request, env, data: ctxData } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const vid = ctxData.volunteer.volunteerId;

  const { data: acts, error } = await supabase
    .from('activities')
    .select('*')
    .in('status', ['upcoming', 'ongoing'])
    .order('activity_date', { ascending: true });

  if (error) return errorResponse(error.message, 400);

  const { data: rsvps } = await supabase
    .from('activity_rsvps')
    .select('activity_id, response')
    .eq('volunteer_id', vid);

  const rsvpMap = {};
  (rsvps || []).forEach(r => { rsvpMap[r.activity_id] = r.response; });

  const withRsvp = (acts || []).map(a => ({ ...a, my_rsvp: rsvpMap[a.id] || null }));

  return jsonResponse({ activities: withRsvp });
}
