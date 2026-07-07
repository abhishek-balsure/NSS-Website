import { createSupabase, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);

  const supabase = createSupabase(env);
  const { ref } = params;

  if (request.method === 'GET') {
    const { data, error } = await supabase.from('volunteers').select('*').eq('ref_code', ref).maybeSingle();
    if (error) return errorResponse(error.message, 400);
    if (!data) return errorResponse('Not found', 404);
    return jsonResponse(data);
  }

  return errorResponse('Method not allowed', 405);
}
