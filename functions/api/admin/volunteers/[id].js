import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

// Approve/reject a volunteer's registration.
export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'PUT') return errorResponse('Method not allowed', 405);

  const { status } = await request.json();
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return errorResponse('status must be pending, approved, or rejected');
  }

  const supabase = createSupabaseAdmin(env);
  const { data, error } = await supabase
    .from('volunteers')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 400);
  if (!data) return errorResponse('Volunteer not found', 404);
  return jsonResponse({ volunteer: data });
}
