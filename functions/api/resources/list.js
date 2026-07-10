import { createSupabase, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);
  const url = new URL(request.url);
  const category = url.searchParams.get('category');

  let query = supabase.from('resources').select('*', { count: 'exact' });
  if (category) query = query.eq('category', category);
  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ resources: data, count });
}
