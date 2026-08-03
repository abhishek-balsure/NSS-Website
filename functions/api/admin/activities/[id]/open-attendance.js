import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const { id } = params;

  try {
    let duration = 10; // default to 10 minutes
    try {
      const body = await request.json();
      if (body && typeof body.duration === 'number') {
        duration = body.duration;
      }
    } catch (e) {
      // Body might be empty, ignore parsing error and use default
    }

    // Generate random 4-digit numeric PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    // Calculate expiry timestamp
    const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('activities')
      .update({
        attendance_open: true,
        attendance_pin: pin,
        attendance_expires_at: expiresAt,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 400);
    if (!data) return errorResponse('Activity not found', 404);

    return jsonResponse({
      success: true,
      pin,
      expires_at: expiresAt,
      activity: data,
    });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
