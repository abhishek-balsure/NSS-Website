import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const url = new URL(request.url);
  const activityId = url.searchParams.get('activity_id');
  if (!activityId) {
    return errorResponse('activity_id parameter is required', 400);
  }

  const volunteerId = ctxData.volunteer.volunteerId;
  const supabase = createSupabaseAdmin(env);

  const { data, error } = await supabase
    .from('camp_diaries')
    .select('*')
    .eq('volunteer_id', volunteerId)
    .eq('activity_id', activityId)
    .order('day_number', { ascending: true });

  if (error) return errorResponse(error.message, 400);

  return jsonResponse({ diaries: data || [] });
}
