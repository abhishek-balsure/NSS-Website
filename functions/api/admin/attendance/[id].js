import { createSupabase, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, params, admin } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'PUT') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);
  const { id } = params;

  const body = await request.json();
  const { status, hours_attended, remarks } = body;

  if (!status || !['present', 'absent'].includes(status)) {
    return errorResponse('Status must be "present" or "absent"');
  }
  if (status === 'present' && (hours_attended === undefined || hours_attended === null)) {
    return errorResponse('hours_attended is required when approving');
  }

  const update = {
    status,
    marked_by: admin.userId,
    remarks: remarks || '',
  };
  if (status === 'present') update.hours_attended = hours_attended;

  const { data, error } = await supabase
    .from('attendance')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 400);
  if (!data) return errorResponse('Attendance record not found', 404);

  return jsonResponse({ attendance: data });
}
