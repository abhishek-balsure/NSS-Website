import { createSupabase, createSupabaseAdmin, jsonResponse, errorResponse, verifyVolunteerSession } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);

  let query = supabase.from('activities').select('*', { count: 'exact' });
  query = query.order('activity_date', { ascending: true });

  const { data: activities, error, count } = await query;
  if (error) return errorResponse(error.message, 400);

  const admin = createSupabaseAdmin(env);

  // Attach the authenticated volunteer's registration status per activity
  let registrations = [];
  const session = await verifyVolunteerSession(request, env);
  if (session) {
    const { data: regs } = await admin
      .from('event_registrations')
      .select('event_id, status')
      .eq('volunteer_id', session.volunteerId);
    if (regs) registrations = regs;
  }

  const regMap = {};
  registrations.forEach(r => { regMap[r.event_id] = r.status; });

  // Get active registration counts per activity
  const { data: allRegs } = await admin
    .from('event_registrations')
    .select('event_id')
    .eq('status', 'registered');

  const countMap = {};
  (allRegs || []).forEach(r => {
    countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
  });

  const enriched = (activities || []).map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    event_date: a.activity_date,
    time: a.time || '',
    category: a.activity_type || 'general',
    venue: a.location || '',
    leader: a.leader || '',
    max_capacity: a.max_volunteers || 0,
    current_count: countMap[a.id] || 0,
    is_waitlist_enabled: a.is_waitlist_enabled || false,
    is_urgent: a.is_urgent || false,
    status: a.status,
    attendance_open: a.attendance_open || false,
    attendance_expires_at: a.attendance_expires_at || null,
    user_registration_status: regMap[a.id] || null,
  }));

  return jsonResponse({ events: enriched, count });
}
