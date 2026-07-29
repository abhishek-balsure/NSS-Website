import { createSupabaseAdmin, jsonResponse, errorResponse, verifyVolunteerSession } from '../../_utils.js';

// Register/waitlist for an Activity (consolidated — no more separate
// "events" table). Capacity is computed live via a count query rather
// than a stored counter, so it can never drift out of sync.
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const session = await verifyVolunteerSession(request, env);
  if (!session) return errorResponse('Unauthorized — please log in', 401);
  const vid = session.volunteerId;

  const supabase = createSupabaseAdmin(env);

  try {
    const { event_id } = await request.json(); // "event_id" name kept — it's an activity id
    if (!event_id) return errorResponse('event_id is required');

    const { data: activity, error: actErr } = await supabase
      .from('activities').select('id, max_volunteers, is_waitlist_enabled, status').eq('id', event_id).single();
    if (actErr || !activity) return errorResponse('Event not found', 404);
    if (activity.status === 'completed' || activity.status === 'cancelled') {
      return errorResponse('This event is no longer open for registration');
    }

    const { data: existing } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', event_id)
      .eq('volunteer_id', vid)
      .maybeSingle();

    if (existing && existing.status === 'registered') {
      return errorResponse('You are already registered for this event');
    }
    if (existing && existing.status === 'waitlisted') {
      return errorResponse('You are already on the waitlist for this event');
    }

    const { count: currentCount } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id)
      .eq('status', 'registered');

    const isFull = activity.max_volunteers > 0 && (currentCount || 0) >= activity.max_volunteers;

    if (isFull && !activity.is_waitlist_enabled) {
      return errorResponse('This event is full and waitlist is not available');
    }

    const newStatus = (isFull && activity.is_waitlist_enabled) ? 'waitlisted' : 'registered';

    if (existing && existing.status === 'cancelled') {
      const { error: updErr } = await supabase
        .from('event_registrations')
        .update({ status: newStatus, registered_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updErr) return errorResponse(updErr.message, 400);
    } else {
      const { error: insErr } = await supabase
        .from('event_registrations')
        .insert({ event_id, volunteer_id: vid, status: newStatus });
      if (insErr) return errorResponse(insErr.message, 400);
    }

    return jsonResponse({ status: newStatus, message: newStatus === 'waitlisted' ? "You've been added to the waitlist" : "You're registered!" });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
