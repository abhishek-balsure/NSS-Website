import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const { title, description, event_year, event_month } = await request.json();
    const year = parseInt(event_year);
    const month = parseInt(event_month);

    if (!title || !year || !month || month < 1 || month > 12) {
      return errorResponse('title, event_year, and event_month (1-12) are required');
    }

    const supabase = createSupabaseAdmin(env);
    const { data, error } = await supabase.from('gallery_albums').insert({
      title, description: description || '', event_year: year, event_month: month,
    }).select().single();

    if (error) return errorResponse(error.message, 400);
    return jsonResponse({ album: data }, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
