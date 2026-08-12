import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  // Fetch pending camp diaries with volunteer and activity details
  const { data, error } = await supabase
    .from('camp_diaries')
    .select(`
      id,
      day_number,
      work_description,
      hours_spent,
      photo_url,
      status,
      created_at,
      volunteer:volunteer_id (
        id,
        name,
        ref_code,
        department
      ),
      activity:activity_id (
        id,
        title
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) return errorResponse(error.message, 400);

  return jsonResponse({ pendingDiaries: data || [] });
}
