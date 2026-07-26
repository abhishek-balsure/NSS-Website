import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

// Public: aggregate counts only — never individual volunteer records.
// Safe to expose since it's just totals, no PII of any kind.
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  const { count: volunteerCount } = await supabase
    .from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'approved');

  const { count: activityCount } = await supabase
    .from('activities').select('*', { count: 'exact', head: true });

  const { data: attendance } = await supabase
    .from('attendance').select('hours_attended').eq('status', 'approved');

  const totalHours = (attendance || []).reduce((sum, a) => sum + (parseFloat(a.hours_attended) || 0), 0);

  return jsonResponse({
    volunteers: volunteerCount || 0,
    activities: activityCount || 0,
    totalHours: Math.round(totalHours),
  });
}
