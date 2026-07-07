import { createSupabase, jsonResponse, errorResponse, getUser } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);
  const user = await getUser(supabase, request);
  if (!user) return errorResponse('Unauthorized', 401);

  const url = new URL(request.url);
  const activity_id = url.searchParams.get('activity_id');
  const volunteer_id = url.searchParams.get('volunteer_id');

  let query = supabase.from('attendance').select('*, volunteers(name, ref_code, department), activities(title, activity_date)');
  if (activity_id) query = query.eq('activity_id', activity_id);
  if (volunteer_id) query = query.eq('volunteer_id', volunteer_id);
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ attendance: data });
}
