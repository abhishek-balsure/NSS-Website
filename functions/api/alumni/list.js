/*
  Requires table: alumni_stories (see /api/resources/list.js for full schema)
*/

import { createSupabase, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);

  const { data, error } = await supabase
    .from('alumni_stories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ alumni: data });
}
