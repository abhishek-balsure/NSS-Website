import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const volunteerId = ctxData.volunteer.volunteerId;

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const score = parseInt(body.score, 10);
  const total = parseInt(body.total, 10);
  if (Number.isNaN(score) || Number.isNaN(total) || score < 0 || total <= 0 || score > total) {
    return errorResponse('Invalid score payload');
  }
  const percentage = Math.round((score / total) * 100);

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  // ── Once per calendar month — reject if already attempted ──
  const { data: existing } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('volunteer_id', volunteerId)
    .eq('month', month)
    .maybeSingle();

  if (existing) {
    return jsonResponse(
      { error: 'You have already attempted the quiz this month.', next_attempt_at: nextMonth },
      409
    );
  }

  // ── Which set is active this month (for the attempt record) ──
  const { data: sets } = await supabase
    .from('quiz_sets')
    .select('id, slot')
    .eq('active', true)
    .order('slot', { ascending: true });

  let set = null;
  if (sets && sets.length > 0) {
    const monthNumber = now.getMonth() + 1;
    const slot = ((monthNumber - 1) % sets.length) + 1;
    set = sets.find(s => s.slot === slot) || sets[0];
  }

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({ volunteer_id: volunteerId, set_id: set ? set.id : null, score, total_questions: total, percentage, month })
    .select()
    .single();

  if (error) {
    // Unique index may have caught a concurrent attempt
    if (error.code === '23505') {
      return jsonResponse({ error: 'You have already attempted the quiz this month.', next_attempt_at: nextMonth }, 409);
    }
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ success: true, attempt: data });
}
