import { createSupabase, createSupabaseAdmin, jsonResponse, errorResponse, verifyVolunteerSession } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);
  const url = new URL(request.url);

  let query = supabase.from('events').select('*', { count: 'exact' });
  query = query.order('event_date', { ascending: true });

  const { data: events, error, count } = await query;
  if (error) return errorResponse(error.message, 400);

  // Attach the authenticated volunteer's registration status per event
  let registrations = [];
  const session = await verifyVolunteerSession(request, env);
  if (session) {
    const admin = createSupabaseAdmin(env);
    const { data: regs } = await admin
      .from('event_registrations')
      .select('event_id, status')
      .eq('volunteer_id', session.volunteerId);
    if (regs) registrations = regs;
  }

  const regMap = {};
  registrations.forEach(r => { regMap[r.event_id] = r.status; });

  const enriched = (events || []).map(e => ({
    ...e,
    user_registration_status: regMap[e.id] || null,
  }));

  return jsonResponse({ events: enriched, count });
}
