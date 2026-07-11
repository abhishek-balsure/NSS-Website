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

    // Fetch registration
    const { data: reg, error: regErr } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', event_id)
      .eq('volunteer_id', vid)
      .maybeSingle();

    if (regErr) return errorResponse(regErr.message, 400);
    if (!reg) return errorResponse('You are not registered for this event');
    if (reg.status === 'cancelled') return errorResponse('Registration is already cancelled');

    const wasRegistered = reg.status === 'registered';

    // Mark cancelled
    const { error: updErr } = await supabase
      .from('event_registrations')
      .update({ status: 'cancelled' })
      .eq('id', reg.id);
    if (updErr) return errorResponse(updErr.message, 400);

    if (wasRegistered) {
      // Decrement event count
      await supabase.rpc('decrement_event_count', { eid: event_id });

      // Promote first waitlisted user (if any)
      const { data: nextUp } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', event_id)
        .eq('status', 'waitlisted')
        .order('registered_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextUp) {
        await supabase
          .from('event_registrations')
          .update({ status: 'registered', registered_at: new Date().toISOString() })
          .eq('id', nextUp.id);
        await supabase.rpc('increment_event_count', { eid: event_id });
      }
    }

    return jsonResponse({ status: 'cancelled' });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
