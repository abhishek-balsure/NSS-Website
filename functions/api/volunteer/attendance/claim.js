import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const vid = ctxData.volunteer.volunteerId;

  try {
    const { activity_id, pin, attended, latitude, longitude } = await request.json();

    if (!activity_id) return errorResponse('activity_id is required');
    if (attended === undefined) return errorResponse('attended (true/false) is required');

    // Handle Declared Absent (Attended = false)
    if (attended === false) {
      // Check duplicate submission
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('volunteer_id', vid)
        .eq('activity_id', activity_id)
        .maybeSingle();

      if (existing) {
        return jsonResponse({ success: true, message: 'Declaration already recorded' });
      }

      // Record self-declared absence
      const { error: insErr } = await supabase.from('attendance').insert({
        volunteer_id: vid,
        activity_id,
        status: 'rejected',
        photo_url: '',
        remarks: 'Self-declared absent',
        hours_attended: 0,
      });

      if (insErr) return errorResponse(insErr.message, 400);
      return jsonResponse({ success: true, status: 'rejected', message: 'Absence recorded' });
    }

    // Handle Present (Attended = true)
    if (!pin) return errorResponse('Secret 4-digit PIN is required');

    // 1. Fetch activity check parameters
    const { data: act, error: actErr } = await supabase
      .from('activities')
      .select('id, status, attendance_open, attendance_pin, attendance_expires_at, latitude, longitude')
      .eq('id', activity_id)
      .single();

    if (actErr || !act) return errorResponse('Activity not found', 404);
    if (!act.attendance_open) return errorResponse('Attendance is not currently open for this activity');

    // 2. Validate Expiry Timer
    const now = new Date();
    if (act.attendance_expires_at && new Date(act.attendance_expires_at) < now) {
      return errorResponse('The attendance submission window has expired');
    }

    // 3. Validate PIN code
    if (act.attendance_pin !== pin.toString().trim()) {
      return errorResponse('Invalid PIN code. Please try again.');
    }

    // 4. Validate Location (Geofencing) if configured
    if (act.latitude !== null && act.longitude !== null && act.latitude !== undefined && act.longitude !== undefined) {
      if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
        return errorResponse('Location access is required to mark attendance for this activity.');
      }

      const distance = getDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(act.latitude),
        parseFloat(act.longitude)
      );

      if (distance > 200) {
        return errorResponse(`Location verification failed. You are ${Math.round(distance)}m away from the activity venue.`);
      }
    }

    // 4. Validate registration
    const { data: reg, error: regErr } = await supabase
      .from('event_registrations')
      .select('id, status')
      .eq('event_id', activity_id)
      .eq('volunteer_id', vid)
      .maybeSingle();

    if (regErr) return errorResponse(regErr.message, 400);
    if (!reg || reg.status !== 'registered') {
      return errorResponse('You must be registered for this activity to submit attendance', 403);
    }

    // 5. Check duplicate submission
    const { data: existing } = await supabase
      .from('attendance')
      .select('id, status')
      .eq('volunteer_id', vid)
      .eq('activity_id', activity_id)
      .maybeSingle();

    if (existing) {
      return errorResponse('Attendance has already been logged/claimed for this activity', 409);
    }

    // 6. Insert attendance record (pending admin review of hours)
    const { data: attendance, error: attErr } = await supabase
      .from('attendance')
      .insert({
        volunteer_id: vid,
        activity_id,
        status: 'pending',
        photo_url: '',
        remarks: 'Self-claimed via PIN verification',
        hours_attended: 0,
      })
      .select()
      .single();

    if (attErr) return errorResponse(attErr.message, 400);

    return jsonResponse({
      success: true,
      status: 'pending',
      attendance,
      message: 'Attendance claimed successfully! Awaiting hours assignment by admin.',
    }, 201);

  } catch (e) {
    return errorResponse(e.message, 500);
  }
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
