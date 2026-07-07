import { createSupabase, jsonResponse, errorResponse, getUser } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);
  const user = await getUser(supabase, request);
  if (!user) return errorResponse('Unauthorized', 401);

  const url = new URL(request.url);
  const volunteer_id = url.searchParams.get('volunteer_id');

  if (!volunteer_id) return errorResponse('volunteer_id required');

  const { data, error } = await supabase
    .from('attendance')
    .select('status, hours_attended')
    .eq('volunteer_id', volunteer_id);

  if (error) return errorResponse(error.message, 400);

  const attended = data.filter(r => r.status === 'present');
  const total_hours = attended.reduce((sum, r) => sum + (r.hours_attended || 0), 0);

  return jsonResponse({
    volunteer_id,
    total_activities_attended: attended.length,
    total_hours,
    total_records: data.length,
  });
}
