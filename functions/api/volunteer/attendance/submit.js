import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const formData = await request.formData();
    const activity_id = formData.get('activity_id');
    const photo = formData.get('photo');
    const notes = formData.get('notes') || '';

    if (!activity_id) return errorResponse('activity_id is required');
    if (!photo || !(photo instanceof File)) return errorResponse('photo file is required');

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowed.includes(photo.type)) {
      return errorResponse('Photo must be JPEG, PNG, WebP, or HEIC');
    }
    if (photo.size > 5 * 1024 * 1024) {
      return errorResponse('Photo must be under 5 MB');
    }

    const supabase = createSupabaseAdmin(env);
    const vid = ctxData.volunteer.volunteerId;

    // Check volunteer exists and is approved
    const { data: v, error: vErr } = await supabase
      .from('volunteers').select('id, status').eq('id', vid).single();
    if (vErr || !v) return errorResponse('Volunteer not found', 404);

    // Check activity exists and is open
    const { data: act, error: aErr } = await supabase
      .from('activities').select('id, status').eq('id', activity_id).single();
    if (aErr || !act) return errorResponse('Activity not found', 404);
    if (act.status === 'cancelled') return errorResponse('Activity was cancelled');
    if (act.status === 'completed') return errorResponse('Activity is already completed');

    // Check duplicate submission
    const { data: existing } = await supabase
      .from('attendance').select('id, status').eq('volunteer_id', vid).eq('activity_id', activity_id).maybeSingle();
    if (existing) return errorResponse('You already submitted attendance for this activity', 409);

    // Upload photo to Supabase Storage
    const ext = photo.name.split('.').pop() || 'jpg';
    const filePath = `${vid}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data: upload, error: upErr } = await supabase.storage
      .from('attendance-photos')
      .upload(filePath, photo, {
        contentType: photo.type,
        cacheControl: '31536000',
        upsert: false,
      });

    if (upErr) return errorResponse('Photo upload failed: ' + upErr.message, 500);

    // Store the storage PATH, not a public URL — bucket is private,
    // admin panel requests a short-lived signed URL when it needs to display it.

    // Create attendance record (pending — awaiting admin approval)
    const { data: attendance, error: attErr } = await supabase.from('attendance').insert({
      volunteer_id: vid,
      activity_id,
      status: 'pending',
      photo_url: filePath,
      notes,
      submitted_by: vid,
      hours_attended: 0,
    }).select().single();

    if (attErr) {
      // Rollback photo
      await supabase.storage.from('attendance-photos').remove([filePath]);
      return errorResponse('Failed to save attendance: ' + attErr.message, 400);
    }

    return jsonResponse({
      attendance,
      photo_url: filePath,
      message: 'Attendance submitted! Awaiting admin approval.',
    }, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
