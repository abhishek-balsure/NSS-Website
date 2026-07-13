import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

// Super-admin only: remove an admin account.
export async function onRequest(context) {
  const { request, env, params, data: ctxData } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'DELETE') return errorResponse('Method not allowed', 405);

  if (ctxData.admin.role !== 'super_admin') {
    return errorResponse('Only super admins can remove admin accounts', 403);
  }
  if (params.id === ctxData.admin.userId) {
    return errorResponse('You cannot remove your own admin account', 400);
  }

  const supabase = createSupabaseAdmin(env);
  const { error } = await supabase.from('admins').delete().eq('id', params.id);
  if (error) return errorResponse(error.message, 400);
  await supabase.auth.admin.deleteUser(params.id); // also remove the login itself
  return jsonResponse({ deleted: true });
}
