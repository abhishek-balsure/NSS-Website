import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  const { data: attendance, error: attErr } = await supabase
    .from('attendance')
    .select('status, hours_attended, activity:activity_id(title, activity_type, activity_date)');
  if (attErr) return errorResponse(attErr.message, 400);

  const { data: volunteers, error: volErr } = await supabase.from('volunteers').select('status');
  if (volErr) return errorResponse(volErr.message, 400);

  // ── Quiz completion stats ──
  const { data: quizAttempts, error: quizErr } = await supabase
    .from('quiz_attempts')
    .select('score, total_questions, percentage, month, volunteer:volunteer_id(name)');
  if (quizErr) return errorResponse(quizErr.message, 400);

  // Completions by month (from the attempt's month column)
  const byQuizMonth = {};
  (quizAttempts || []).forEach(a => {
    const m = (a.month || '').slice(0, 7);
    if (!m) return;
    byQuizMonth[m] = (byQuizMonth[m] || 0) + 1;
  });
  const quizAttemptsByMonth = Object.entries(byQuizMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const quizAttemptsThisMonth = quizAttemptsByMonth.find(m => m.month === thisMonth)?.count || 0;

  const recentQuizAttempts = (quizAttempts || [])
    .filter(a => a.volunteer)
    .sort((a, b) => new Date(b.month + '-01') - new Date(a.month + '-01'))
    .slice(0, 8)
    .map(a => ({
      name: a.volunteer.name,
      percentage: a.percentage,
      score: a.score,
      total: a.total_questions,
      month: a.month,
    }));

  // Attendance by month (based on the linked activity's date)
  const byMonth = {};
  (attendance || []).forEach(a => {
    if (a.status !== 'approved' || !a.activity || !a.activity.activity_date) return;
    const d = new Date(a.activity.activity_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth[key] = (byMonth[key] || 0) + 1;
  });
  const attendanceByMonth = Object.entries(byMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6) // last 6 months with data
    .map(([month, count]) => ({ month, count }));

  // Most attended activity types (approved attendance)
  const byActivityType = {};
  (attendance || []).forEach(a => {
    if (a.status !== 'approved' || !a.activity) return;
    const type = a.activity.activity_type || 'general';
    byActivityType[type] = (byActivityType[type] || 0) + 1;
  });
  const topActivityTypes = Object.entries(byActivityType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  // Volunteer status breakdown
  const volunteerStatus = { pending: 0, approved: 0, rejected: 0 };
  (volunteers || []).forEach(v => { volunteerStatus[v.status] = (volunteerStatus[v.status] || 0) + 1; });

  // Total approved volunteer-hours logged
  const totalHours = (attendance || [])
    .filter(a => a.status === 'approved')
    .reduce((sum, a) => sum + (parseFloat(a.hours_attended) || 0), 0);

  return jsonResponse({ attendanceByMonth, topActivityTypes, volunteerStatus, totalHours, quizAttemptsByMonth, quizAttemptsThisMonth, recentQuizAttempts });
}
