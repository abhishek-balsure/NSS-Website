import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

// This volunteer's own past attendance submissions, with activity info joined.
// Uses select('*') for the attendance row itself so this keeps working
// regardless of exact column names on that table.
export async function onRequest(context) {
  const { request, env, data: ctxData } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const vid = ctxData.volunteer.volunteerId;

  const { data, error } = await supabase
    .from('attendance')
    .select('*, activity:activity_id(title, activity_date, location, activity_type)')
    .eq('volunteer_id', vid);

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ attendance: data || [] });
}
