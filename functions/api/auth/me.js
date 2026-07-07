import { createSupabase, jsonResponse, errorResponse, getUser } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);
  const user = await getUser(supabase, request);
  if (!user) return errorResponse('Unauthorized', 401);

  const { data: admin, error } = await supabase.from('admins').select('*').eq('id', user.id).single();
  if (error || !admin) return errorResponse('Admin record not found', 404);

  return jsonResponse(admin);
}
