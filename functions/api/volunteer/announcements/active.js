import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  try {
    const nowIso = new Date().toISOString();

    // Fetch active announcements
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true);

    if (error) return errorResponse(error.message, 400);

    // Filter out expired announcements in memory
    const activeList = (announcements || []).filter(a => {
      if (!a.expires_at) return true;
      return new Date(a.expires_at) > new Date();
    });

    // Sort: urgent (3) > warning (2) > info (1), and then created_at desc
    const priorityWeight = { urgent: 3, warning: 2, info: 1 };
    activeList.sort((a, b) => {
      const wa = priorityWeight[a.priority] || 0;
      const wb = priorityWeight[b.priority] || 0;
      if (wa !== wb) return wb - wa;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

    return jsonResponse({ announcements: activeList });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
