import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const body = await request.json();
    const { title, event_date, category } = body;
    if (!title || !event_date || !category) {
      return errorResponse('title, event_date, and category are required');
    }

    const supabase = createSupabaseAdmin(env);
    const { data, error } = await supabase.from('events').insert({
      title,
      description: body.description || '',
      event_date,
      time: body.time || '',
      category,
      venue: body.venue || '',
      leader: body.leader || '',
      max_capacity: parseInt(body.max_capacity) || 0,
      is_waitlist_enabled: !!body.is_waitlist_enabled,
      is_urgent: !!body.is_urgent,
    }).select().single();

    if (error) return errorResponse(error.message, 400);
    return jsonResponse({ event: data }, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
