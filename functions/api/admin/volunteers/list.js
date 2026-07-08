import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  const { data, error } = await supabase
    .from('volunteers')
    .select('id, ref_code, name, email, mobile_no, department, academic_year, class, roll_no, status, created_at, auth_user_id');

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ volunteers: data || [] });
}
