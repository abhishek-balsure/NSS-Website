import { createSupabase, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);

  let query = supabase.from('alumni_stories').select('*', { count: 'exact' });
  query = query.order('graduation_year', { ascending: false });

  const { data, error, count } = await query;
  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ stories: data, count });
}
