import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../../../_utils.js';

const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const supabase = createSupabaseAdmin(env);

    const { data: album } = await supabase.from('gallery_albums').select('id').eq('id', params.id).maybeSingle();
    if (!album) return errorResponse('Album not found', 404);

    const formData = await request.formData();
    const files = formData.getAll('photos');
    const caption = formData.get('caption') || '';

    if (!files.length) return errorResponse('At least one photo file is required');

    const uploaded = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return errorResponse(`Unsupported file type: ${file.type}. Use JPEG, PNG, or WebP.`);
      }
      if (file.size > MAX_SIZE) {
        return errorResponse(`File too large (max 8MB): ${file.name}`);
      }

      const ext = file.name.split('.').pop();
      const filePath = `${params.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('gallery-photos')
        .upload(filePath, await file.arrayBuffer(), { contentType: file.type });

      if (upErr) return errorResponse(`Upload failed: ${upErr.message}`, 400);

      const { data: pubUrl } = supabase.storage.from('gallery-photos').getPublicUrl(filePath);

      const { data: photo, error: dbErr } = await supabase.from('gallery_photos').insert({
        album_id: params.id,
        photo_path: pubUrl.publicUrl,
        caption,
      }).select().single();

      if (dbErr) return errorResponse(dbErr.message, 400);
      uploaded.push(photo);
    }

    // If the album has no cover photo yet, use the first uploaded one
    const { data: albumRow } = await supabase.from('gallery_albums').select('cover_photo').eq('id', params.id).single();
    if (albumRow && !albumRow.cover_photo && uploaded.length) {
      await supabase.from('gallery_albums').update({ cover_photo: uploaded[0].photo_path }).eq('id', params.id);
    }

    return jsonResponse({ photos: uploaded }, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
