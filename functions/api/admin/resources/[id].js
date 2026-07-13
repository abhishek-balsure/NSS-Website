import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  const supabase = createSupabaseAdmin(env);

  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      const update = {};
      ['title', 'description', 'file_url', 'category'].forEach(k => { if (body[k] !== undefined) update[k] = body[k]; });
      const { data, error } = await supabase.from('resources').update(update).eq('id', params.id).select().single();
      if (error) return errorResponse(error.message, 400);
      if (!data) return errorResponse('Resource not found', 404);
      return jsonResponse({ resource: data });
    } catch (e) { return errorResponse(e.message, 500); }
  }

  if (request.method === 'DELETE') {
    const { error } = await supabase.from('resources').delete().eq('id', params.id);
    if (error) return errorResponse(error.message, 400);
    return jsonResponse({ deleted: true });
  }

  return errorResponse('Method not allowed', 405);
}
