import { createSupabase, jsonResponse, errorResponse, getUser } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);
  const user = await getUser(supabase, request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const body = await request.json();
    const { activity_id, records } = body;

    if (!activity_id || !Array.isArray(records) || records.length === 0) {
      return errorResponse('activity_id and records array required');
    }

    const rows = records.map(r => ({
      volunteer_id: r.volunteer_id,
      activity_id,
      status: r.status || 'present',
      hours_attended: r.hours_attended || 0,
      marked_by: user.id,
      remarks: r.remarks || null,
    }));

    const { data, error } = await supabase.from('attendance').upsert(rows, {
      onConflict: 'volunteer_id, activity_id',
      ignoreDuplicates: false,
    }).select();

    if (error) return errorResponse(error.message, 400);
    return jsonResponse({ attendance: data, count: data.length }, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
