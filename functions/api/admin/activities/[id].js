import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);

  const supabase = createSupabaseAdmin(env);
  const { id } = params;

  // PUT — update activity
  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      const allowed = ['title', 'description', 'activity_date', 'time', 'location', 'leader', 'activity_type', 'max_volunteers', 'is_waitlist_enabled', 'is_urgent', 'status'];
      const update = {};
      allowed.forEach(k => { if (body[k] !== undefined) update[k] = body[k]; });

      if (Object.keys(update).length === 0) return errorResponse('No fields to update');

      const { data, error } = await supabase.from('activities').update(update).eq('id', id).select().single();
      if (error) return errorResponse(error.message, 400);
      if (!data) return errorResponse('Activity not found', 404);
      return jsonResponse({ activity: data });
    } catch (e) {
      return errorResponse(e.message, 500);
    }
  }

  // DELETE — remove activity
  if (request.method === 'DELETE') {
    // Check for linked attendance
    const { count } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('activity_id', id);
    if (count && count > 0) {
      return errorResponse('Cannot delete — attendance records exist for this activity', 409);
    }

    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) return errorResponse(error.message, 400);
    return jsonResponse({ ok: true });
  }

  return errorResponse('Method not allowed', 405);
}
