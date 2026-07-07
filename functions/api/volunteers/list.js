import { createSupabase, corsHeaders, jsonResponse, errorResponse, getUser } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);
  const user = await getUser(supabase, request);
  if (!user) return errorResponse('Unauthorized', 401);

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const department = url.searchParams.get('department');
  const year = url.searchParams.get('academic_year');

  let query = supabase.from('volunteers').select('*', { count: 'exact' });

  if (status) query = query.eq('status', status);
  if (department) query = query.eq('department', department);
  if (year) query = query.eq('academic_year', year);

  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ volunteers: data, count });
}
