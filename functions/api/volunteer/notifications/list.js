import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('volunteer_id', ctxData.volunteer.volunteerId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ notifications: data || [] });
}
