import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'DELETE') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  const { data: photo } = await supabase.from('gallery_photos').select('photo_path').eq('id', params.id).maybeSingle();
  if (!photo) return errorResponse('Photo not found', 404);

  const { error } = await supabase.from('gallery_photos').delete().eq('id', params.id);
  if (error) return errorResponse(error.message, 400);

  const marker = '/gallery-photos/';
  const idx = photo.photo_path.indexOf(marker);
  if (idx >= 0) {
    const path = photo.photo_path.slice(idx + marker.length);
    await supabase.storage.from('gallery-photos').remove([path]);
  }

  return jsonResponse({ deleted: true });
}
