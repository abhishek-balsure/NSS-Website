import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const { id } = params;

  try {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        status,
        hours_attended,
        remarks,
        submitted_at,
        volunteer:volunteer_id(id, name, email, department, roll_no, class, ref_code)
      `)
      .eq('activity_id', id)
      .order('submitted_at', { ascending: false });

    if (error) return errorResponse(error.message, 400);

    return jsonResponse({
      success: true,
      attendance: data || []
    });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
