import { createSupabase, jsonResponse, errorResponse, getUser } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);

  const supabase = createSupabase(env);
  const { id } = params;

  if (request.method === 'GET') {
    const { data, error } = await supabase.from('activities').select('*').eq('id', id).maybeSingle();
    if (error) return errorResponse(error.message, 400);
    if (!data) return errorResponse('Not found', 404);
    return jsonResponse(data);
  }

  return errorResponse('Method not allowed', 405);
}
