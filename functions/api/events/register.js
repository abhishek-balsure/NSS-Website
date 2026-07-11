import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';
import { verifyVolunteerSession } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const session = await verifyVolunteerSession(request, env);
  if (!session) return errorResponse('Unauthorized — please log in', 401);
  const vid = session.volunteerId;

  const supabase = createSupabaseAdmin(env);

  try {
    const { event_id } = await request.json();
    if (!event_id) return errorResponse('event_id is required');

    // Fetch event
    const { data: event, error: evErr } = await supabase
      .from('events').select('*').eq('id', event_id).single();
    if (evErr || !event) return errorResponse('Event not found', 404);

    // Check for existing registration
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', event_id)
      .eq('volunteer_id', vid)
      .maybeSingle();
    if (existing) {
      if (existing.status === 'registered')
        return errorResponse('You are already registered for this event');
      if (existing.status === 'waitlisted')
        return errorResponse('You are already on the waitlist for this event');
      if (existing.status === 'cancelled') {
        // Re-register after cancellation — allow it
        await supabase
          .from('event_registrations')
          .update({ status: 'registered', registered_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (event.current_count < event.max_capacity || event.max_capacity === 0) {
          await supabase.rpc('increment_event_count', { eid: event_id });
        }
        return jsonResponse({ status: 'registered' });
      }
    }

    // Capacity logic
    const isFull = event.max_capacity > 0 && event.current_count >= event.max_capacity;

    if (isFull && !event.is_waitlist_enabled) {
      return errorResponse('This event is full and waitlist is not available');
    }

    let newStatus;
    if (isFull && event.is_waitlist_enabled) {
      newStatus = 'waitlisted';
    } else {
      newStatus = 'registered';
    }

    const { error: insErr } = await supabase
      .from('event_registrations')
      .insert({ event_id, volunteer_id: vid, status: newStatus });

    if (insErr) return errorResponse(insErr.message, 400);

    // Increment count if registered (not waitlisted)
    if (newStatus === 'registered') {
      await supabase.rpc('increment_event_count', { eid: event_id });
    }

    return jsonResponse({ status: newStatus });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
