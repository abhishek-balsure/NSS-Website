import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

// Marks ALL of this volunteer's unread notifications as read.
export async function onRequest(context) {
  const { request, env, data: ctxData } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('volunteer_id', ctxData.volunteer.volunteerId)
    .eq('is_read', false);

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ ok: true });
}
