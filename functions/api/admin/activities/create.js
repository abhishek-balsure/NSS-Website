import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, admin } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  try {
    const body = await request.json();
    const { title, description, activity_date, location, activity_type, max_volunteers, status } = body;

    if (!title || !activity_date || !activity_type) {
      return errorResponse('title, activity_date, and activity_type are required');
    }

    const { data, error } = await supabase.from('activities').insert({
      title,
      description: description || '',
      activity_date,
      location: location || '',
      activity_type,
      max_volunteers: max_volunteers || null,
      status: status || 'upcoming',
      created_by: admin.userId,
    }).select().single();

    if (error) return errorResponse(error.message, 400);
    return jsonResponse({ activity: data }, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
