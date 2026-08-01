import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env, data } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  const [{ count: vCount }, { count: aCount }, { count: tCount }] = await Promise.all([
    supabase.from('volunteers').select('*', { count: 'exact', head: true }),
    supabase.from('activities').select('*', { count: 'exact', head: true }),
    supabase.from('attendance').select('*', { count: 'exact', head: true }),
  ]);

  const { count: pendingCount } = await supabase
    .from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'pending');

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const { count: quizMonthCount } = await supabase
    .from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('month', thisMonth);

  return jsonResponse({
    stats: {
      total_volunteers: vCount ?? 0,
      pending_approvals: pendingCount ?? 0,
      total_activities: aCount ?? 0,
      total_attendance: tCount ?? 0,
      quiz_attempts_this_month: quizMonthCount ?? 0,
    },
    admin: data.admin,
  });
}
