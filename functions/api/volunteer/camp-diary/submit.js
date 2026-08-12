import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const { activity_id, day_number, work_description, hours_spent, photo_url } = await request.json();

    if (!activity_id || !day_number || !work_description) {
      return errorResponse('activity_id, day_number, and work_description are required', 400);
    }

    const dayNum = parseInt(day_number);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 7) {
      return errorResponse('day_number must be an integer between 1 and 7', 400);
    }

    const hours = parseFloat(hours_spent);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      return errorResponse('hours_spent must be a positive number between 0 and 24', 400);
    }

    const volunteerId = ctxData.volunteer.volunteerId;
    const supabase = createSupabaseAdmin(env);

    // 1. Verify that the volunteer is registered for this activity/event
    const { data: registration, error: regErr } = await supabase
      .from('event_registrations')
      .select('status')
      .eq('event_id', activity_id)
      .eq('volunteer_id', volunteerId)
      .maybeSingle();

    if (regErr) return errorResponse(regErr.message, 400);
    if (!registration || registration.status !== 'registered') {
      return errorResponse('You must be registered for this camp/activity to submit a diary.', 403);
    }

    // 2. Check for an existing diary entry for this day
    const { data: existing, error: existErr } = await supabase
      .from('camp_diaries')
      .select('id, status')
      .eq('volunteer_id', volunteerId)
      .eq('activity_id', activity_id)
      .eq('day_number', dayNum)
      .maybeSingle();

    if (existErr) return errorResponse(existErr.message, 400);

    if (existing && existing.status === 'approved') {
      return errorResponse('This diary entry has already been approved and cannot be modified.', 403);
    }

    const diaryData = {
      volunteer_id: volunteerId,
      activity_id,
      day_number: dayNum,
      work_description: work_description.trim(),
      hours_spent: hours,
      photo_url: photo_url ? photo_url.trim() : null,
      status: 'pending', // Reset to pending if it was rejected and edited
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('camp_diaries')
        .update(diaryData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) return errorResponse(error.message, 400);
      result = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('camp_diaries')
        .insert(diaryData)
        .select()
        .single();
      if (error) return errorResponse(error.message, 400);
      result = data;
    }

    return jsonResponse({ message: 'Diary entry submitted successfully', diary: result });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
