import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

// Super-admin only: full JSON export of every table. Supabase's free
// tier has no automated backups — this is a manual safety net until/
// unless a paid plan with point-in-time recovery is worth it.
const TABLES = [
  'volunteers', 'admins', 'activities', 'attendance', 'activity_rsvps',
  'event_registrations', 'gallery_albums', 'gallery_photos',
  'resources', 'alumni_stories',
];

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  if (ctxData.admin.role !== 'super_admin') {
    return errorResponse('Only super admins can export backups', 403);
  }

  const supabase = createSupabaseAdmin(env);
  const backup = { exported_at: new Date().toISOString(), tables: {} };

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('*');
    backup.tables[table] = error ? { error: error.message } : data;
  }

  return new Response(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="nss_backup_${new Date().toISOString().slice(0,10)}.json"`,
    },
  });
}
