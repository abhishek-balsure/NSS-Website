import { createSupabase, jsonResponse, errorResponse, getUser } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);
  const user = await getUser(supabase, request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const body = await request.json();
    body.created_by = user.id;

    const { data, error } = await supabase.from('activities').insert(body).select().single();
    if (error) return errorResponse(error.message, 400);
    return jsonResponse(data, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
