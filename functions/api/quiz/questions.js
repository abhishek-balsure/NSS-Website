import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

// Fisher–Yates shuffle (in place)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const volunteerId = ctxData.volunteer.volunteerId;

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  // ── Already attempted this calendar month? ──
  const { data: existing } = await supabase
    .from('quiz_attempts')
    .select('score, total_questions, percentage')
    .eq('volunteer_id', volunteerId)
    .eq('month', month)
    .maybeSingle();

  if (existing) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return jsonResponse({
      attempted: true,
      score: existing.score,
      total: existing.total_questions,
      percentage: existing.percentage,
      next_attempt_at: nextMonth.toISOString(),
    });
  }

  // ── Pick the set for this month by slot rotation ──
  // slot = ((month_number - 1) % active_set_count) + 1
  const { data: sets, error: setsError } = await supabase
    .from('quiz_sets')
    .select('id, name, slot')
    .eq('active', true)
    .order('slot', { ascending: true });

  if (setsError) return errorResponse(setsError.message, 500);
  if (!sets || sets.length === 0) return errorResponse('No quiz sets configured', 500);

  const monthNumber = now.getMonth() + 1;
  const slot = ((monthNumber - 1) % sets.length) + 1;
  const activeSet = sets.find(s => s.slot === slot) || sets[0];

  const { data: questions, error: qError } = await supabase
    .from('quiz_questions')
    .select('id, question, options, correct_index, explanation')
    .eq('set_id', activeSet.id);

  if (qError) return errorResponse(qError.message, 500);
  if (!questions || questions.length === 0) return errorResponse('No questions in this month\'s set', 500);

  // Shuffle question order AND shuffle each question's options (remapping
  // the correct index), so every volunteer gets a unique-looking quiz even
  // within the same month.
  const payload = shuffle(questions).map(q => {
    const indexed = q.options.map((text, i) => ({ text, i }));
    shuffle(indexed);
    const correctIndex = indexed.findIndex(o => o.i === q.correct_index);
    return {
      id: q.id,
      question: q.question,
      choices: indexed.map(o => o.text),
      answer: correctIndex,
      explanation: q.explanation,
    };
  });

  return jsonResponse({
    attempted: false,
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    set_name: activeSet.name,
    total: payload.length,
    questions: payload,
  });
}
