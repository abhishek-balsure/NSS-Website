import { createSupabase, createSupabaseAdmin, jsonResponse, errorResponse, verifyVolunteerSession } from '../../_utils.js';

// Events & Notices page now reads live from Activities — no more
// separate manual "Event" entries. Field names below are ALIASED to
// exactly match what events.html's frontend already expects
// (event_date, venue, category, max_capacity, current_count), so the
// frontend needed zero changes for this consolidation.
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);

  const { data: activities, error } = await supabase
    .from('activities')
    .select('id, title, description, activity_date, time, location, leader, activity_type, max_volunteers, is_waitlist_enabled, is_urgent, status')
    .in('status', ['upcoming', 'ongoing'])
    .order('activity_date', { ascending: true });

  if (error) return errorResponse(error.message, 400);

  const admin = createSupabaseAdmin(env);

  // Registered-count per activity (RLS blocks anon reads on this table,
  // so this part needs the service-role key — we only ever aggregate a
  // count here, never expose individual registrant identities publicly)
  const { data: allRegs } = await admin
    .from('event_registrations')
    .select('event_id, status')
    .eq('status', 'registered');

  const countMap = {};
  (allRegs || []).forEach(r => { countMap[r.event_id] = (countMap[r.event_id] || 0) + 1; });

  // Attach the authenticated volunteer's own registration status, if any
  let myRegs = [];
  const session = await verifyVolunteerSession(request, env);
  if (session) {
    const { data: regs } = await admin
      .from('event_registrations')
      .select('event_id, status')
      .eq('volunteer_id', session.volunteerId);
    if (regs) myRegs = regs;
  }
  const myRegMap = {};
  myRegs.forEach(r => { myRegMap[r.event_id] = r.status; });

  const enriched = (activities || []).map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    event_date: a.activity_date,
    time: a.time,
    venue: a.location,
    leader: a.leader,
    category: a.activity_type,
    max_capacity: a.max_volunteers,
    current_count: countMap[a.id] || 0,
    is_waitlist_enabled: a.is_waitlist_enabled,
    is_urgent: a.is_urgent,
    user_registration_status: myRegMap[a.id] || null,
  }));

  return jsonResponse({ events: enriched, count: enriched.length });
}
