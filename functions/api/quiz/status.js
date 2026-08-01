import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

// Lightweight quiz status for the volunteer dashboard — tells whether the
// current month's quiz has been attempted and returns the recorded result.
export async function onRequest(context) {
  const { request, env, data: ctxData } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const volunteerId = ctxData.volunteer.volunteerId;

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('score, total_questions, percentage, month, created_at, set:set_id(name)')
    .eq('volunteer_id', volunteerId)
    .eq('month', month)
    .maybeSingle();

  if (!attempt) {
    const nextAttempt = null;
    return jsonResponse({ attempted: false, month, next_attempt_at: nextAttempt });
  }

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return jsonResponse({
    attempted: true,
    score: attempt.score,
    total: attempt.total_questions,
    percentage: attempt.percentage,
    set_name: attempt.set ? attempt.set.name : null,
    attempted_at: attempt.created_at,
    next_attempt_at: nextMonth.toISOString(),
  });
}
