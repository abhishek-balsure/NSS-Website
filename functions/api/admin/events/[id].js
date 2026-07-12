import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);

  const supabase = createSupabaseAdmin(env);

  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      const update = {};
      ['title', 'description', 'event_date', 'time', 'category', 'venue', 'leader'].forEach(k => {
        if (body[k] !== undefined) update[k] = body[k];
      });
      if (body.max_capacity !== undefined) update.max_capacity = parseInt(body.max_capacity) || 0;
      if (body.is_waitlist_enabled !== undefined) update.is_waitlist_enabled = !!body.is_waitlist_enabled;
      if (body.is_urgent !== undefined) update.is_urgent = !!body.is_urgent;

      const { data, error } = await supabase.from('events').update(update).eq('id', params.id).select().single();
      if (error) return errorResponse(error.message, 400);
      if (!data) return errorResponse('Event not found', 404);
      return jsonResponse({ event: data });
    } catch (e) {
      return errorResponse(e.message, 500);
    }
  }

  if (request.method === 'DELETE') {
    const { error } = await supabase.from('events').delete().eq('id', params.id);
    if (error) return errorResponse(error.message, 400);
    return jsonResponse({ deleted: true });
  }

  return errorResponse('Method not allowed', 405);
}
