import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  let query = supabase.from('activities').select('*', { count: 'exact' }).order('activity_date', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ activities: data, count });
}
