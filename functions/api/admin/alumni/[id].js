import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  const supabase = createSupabaseAdmin(env);

  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      const update = {};
      ['name', 'profession', 'company', 'photo_url', 'story_content', 'linkedin_url'].forEach(k => {
        if (body[k] !== undefined) update[k] = body[k];
      });
      if (body.graduation_year !== undefined) update.graduation_year = parseInt(body.graduation_year) || null;

      const { data, error } = await supabase.from('alumni_stories').update(update).eq('id', params.id).select().single();
      if (error) return errorResponse(error.message, 400);
      if (!data) return errorResponse('Alumni story not found', 404);
      return jsonResponse({ alumnus: data });
    } catch (e) { return errorResponse(e.message, 500); }
  }

  if (request.method === 'DELETE') {
    const { error } = await supabase.from('alumni_stories').delete().eq('id', params.id);
    if (error) return errorResponse(error.message, 400);
    return jsonResponse({ deleted: true });
  }

  return errorResponse('Method not allowed', 405);
}
