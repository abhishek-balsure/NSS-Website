import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

// Public: top volunteers by approved hours. Only shows name, department,
// and hours — never Aadhar, address, or other sensitive registration
// fields. Uses the service-role key because volunteers/attendance RLS
// intentionally blocks anon reads entirely (they hold PII) — safe here
// ONLY because this code selects exactly 3 non-sensitive columns and
// nothing else, never `select('*')`.
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  const { data: attendance, error } = await supabase
    .from('attendance')
    .select('hours_attended, volunteer:volunteer_id(id, name, department, ref_code, show_on_leaderboard)')
    .eq('status', 'approved');

  if (error) return errorResponse(error.message, 400);

  const totals = {};
  (attendance || []).forEach(a => {
    if (!a.volunteer || a.volunteer.show_on_leaderboard === false) return;
    const id = a.volunteer.id;
    if (!totals[id]) totals[id] = { name: a.volunteer.name, department: a.volunteer.department, hours: 0 };
    totals[id].hours += parseFloat(a.hours_attended) || 0;
  });

  const leaderboard = Object.values(totals)
    .filter(v => v.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 50);

  return jsonResponse({ leaderboard });
}
