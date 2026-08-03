import { createSupabase, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);
  const url = new URL(request.url);
  const statusRaw = url.searchParams.get('status');
  const type = url.searchParams.get('type');

  let query = supabase.from('activities').select('id, title, description, activity_date, location, activity_type, max_volunteers, status, time, leader, attendance_open, attendance_expires_at', { count: 'exact' });
  if (statusRaw) {
    const parts = statusRaw.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length === 1) query = query.eq('status', parts[0]);
    else query = query.in('status', parts);
  }
  if (type) query = query.eq('activity_type', type);
  query = query.order('activity_date', { ascending: false });

  const { data, error, count } = await query;
  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ activities: data, count });
}
