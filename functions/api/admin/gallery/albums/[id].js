import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);

  const supabase = createSupabaseAdmin(env);

  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      const update = {};
      if (body.title !== undefined) update.title = body.title;
      if (body.description !== undefined) update.description = body.description;
      if (body.event_year !== undefined) update.event_year = parseInt(body.event_year);
      if (body.event_month !== undefined) update.event_month = parseInt(body.event_month);

      const { data, error } = await supabase.from('gallery_albums').update(update).eq('id', params.id).select().single();
      if (error) return errorResponse(error.message, 400);
      if (!data) return errorResponse('Album not found', 404);
      return jsonResponse({ album: data });
    } catch (e) {
      return errorResponse(e.message, 500);
    }
  }

  if (request.method === 'DELETE') {
    // Fetch photo paths first so we can also remove them from storage
    const { data: photos } = await supabase.from('gallery_photos').select('photo_path').eq('album_id', params.id);
    const { error } = await supabase.from('gallery_albums').delete().eq('id', params.id);
    if (error) return errorResponse(error.message, 400);

    if (photos && photos.length) {
      const paths = photos.map(p => {
        // photo_path is stored as a full public URL — extract the storage-relative path
        const marker = '/gallery-photos/';
        const idx = p.photo_path.indexOf(marker);
        return idx >= 0 ? p.photo_path.slice(idx + marker.length) : null;
      }).filter(Boolean);
      if (paths.length) await supabase.storage.from('gallery-photos').remove(paths);
    }

    return jsonResponse({ deleted: true });
  }

  return errorResponse('Method not allowed', 405);
}
