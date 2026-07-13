import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const body = await request.json();
    if (!body.name) return errorResponse('name is required');

    const supabase = createSupabaseAdmin(env);
    const { data, error } = await supabase.from('alumni_stories').insert({
      name: body.name,
      graduation_year: body.graduation_year ? parseInt(body.graduation_year) : null,
      profession: body.profession || '',
      company: body.company || '',
      photo_url: body.photo_url || '',
      story_content: body.story_content || '',
      linkedin_url: body.linkedin_url || '',
    }).select().single();

    if (error) return errorResponse(error.message, 400);
    return jsonResponse({ alumnus: data }, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
