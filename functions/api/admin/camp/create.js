import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  try {
    const body = await request.json();
    const { day_number, title, description, log_date, photos } = body;

    if (!day_number || isNaN(parseInt(day_number))) {
      return errorResponse('Valid Day Number is required', 400);
    }
    if (!title || !title.trim()) {
      return errorResponse('Title is required', 400);
    }
    if (!description || !description.trim()) {
      return errorResponse('Description is required', 400);
    }
    if (!log_date) {
      return errorResponse('Log Date is required', 400);
    }

    const insertData = {
      day_number: parseInt(day_number),
      title: title.trim(),
      description: description.trim(),
      log_date,
      photos: Array.isArray(photos) ? photos : []
    };

    const { data, error } = await supabase
      .from('camp_logs')
      .insert(insertData)
      .select()
      .single();

    if (error) return errorResponse(error.message, 400);

    return jsonResponse({ success: true, log: data });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
