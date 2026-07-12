import { createSupabase, jsonResponse, errorResponse } from '../../_utils.js';

// Public: all albums + their photos, for the year/month gallery page.
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);
  const { data: albums, error } = await supabase
    .from('gallery_albums')
    .select('id, title, description, event_year, event_month, cover_photo, gallery_photos(id, photo_path, caption)')
    .order('event_year', { ascending: false })
    .order('event_month', { ascending: false });

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ albums: albums || [] });
}
