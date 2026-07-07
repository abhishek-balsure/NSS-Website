import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env, volunteer } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  const { data, error } = await supabase
    .from('volunteers')
    .select('*')
    .eq('id', volunteer.volunteerId)
    .single();

  if (error || !data) return errorResponse('Volunteer not found', 404);

  return jsonResponse({ user: data });
}
