import { createSupabase, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);

  try {
    const { data: logs, error } = await supabase
      .from('camp_logs')
      .select('*')
      .order('day_number', { ascending: true });

    if (error) return errorResponse(error.message, 400);

    return jsonResponse({ logs: logs || [] });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
