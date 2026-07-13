import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const { title, description, file_url, category } = await request.json();
    if (!title || !file_url) return errorResponse('title and file_url are required');

    const supabase = createSupabaseAdmin(env);
    const { data, error } = await supabase.from('resources').insert({
      title, description: description || '', file_url, category: category || 'general',
    }).select().single();

    if (error) return errorResponse(error.message, 400);
    return jsonResponse({ resource: data }, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
