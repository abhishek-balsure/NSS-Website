import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  try {
    const body = await request.json();
    const { title, description, activity_date, time, location, leader, activity_type, max_volunteers, is_waitlist_enabled, is_urgent, status } = body;

    if (!title || !activity_date || !activity_type) {
      return errorResponse('title, activity_date, and activity_type are required');
    }

    const { data, error } = await supabase.from('activities').insert({
      title,
      description: description || '',
      activity_date,
      time: time || '',
      location: location || '',
      leader: leader || '',
      activity_type,
      max_volunteers: max_volunteers || null,
      is_waitlist_enabled: !!is_waitlist_enabled,
      is_urgent: !!is_urgent,
      status: status || 'upcoming',
      created_by: ctxData.admin.userId,
    }).select().single();

    if (error) return errorResponse(error.message, 400);
    return jsonResponse({ activity: data }, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
