import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  try {
    const { title, message, priority, expires_at } = await request.json();

    if (!title || !title.trim()) {
      return errorResponse('Title is required', 400);
    }
    if (!message || !message.trim()) {
      return errorResponse('Message is required', 400);
    }

    const validPriorities = ['info', 'warning', 'urgent'];
    const p = validPriorities.includes(priority) ? priority : 'info';

    const insertData = {
      title: title.trim(),
      message: message.trim(),
      priority: p,
      is_active: true,
      expires_at: expires_at ? new Date(expires_at).toISOString() : null
    };

    const { data, error } = await supabase
      .from('announcements')
      .insert(insertData)
      .select()
      .single();

    if (error) return errorResponse(error.message, 400);

    return jsonResponse({ success: true, announcement: data });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
