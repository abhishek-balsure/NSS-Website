import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

// Super-admin only: list all admin accounts.
export async function onRequest(context) {
  const { request, env, data: ctxData } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  if (ctxData.admin.role !== 'super_admin') {
    return errorResponse('Only super admins can manage admin accounts', 403);
  }

  const supabase = createSupabaseAdmin(env);
  const { data, error } = await supabase.from('admins').select('id, email, name, role, created_at').order('created_at');
  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ admins: data || [] });
}
