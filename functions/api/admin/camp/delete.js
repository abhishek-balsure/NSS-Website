import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'DELETE') return errorResponse('Method not allowed', 405);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return errorResponse('Camp Log ID is required', 400);
  }

  const supabase = createSupabaseAdmin(env);

  try {
    const { error } = await supabase
      .from('camp_logs')
      .delete()
      .eq('id', id);

    if (error) return errorResponse(error.message, 400);

    return jsonResponse({ success: true, message: 'Camp Log deleted successfully' });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
