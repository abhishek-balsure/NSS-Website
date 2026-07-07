import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id, status, photo_url, notes, hours_attended, created_at,
      volunteer:volunteer_id(id, name, email, department, ref_code, mobile_no),
      activity:activity_id(id, title, activity_date, location, activity_type)
    `)
    .in('status', ['pending', 'rejected'])
    .order('created_at', { ascending: false });

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ attendance: data });
}
