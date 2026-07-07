import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id, status, photo_url, notes, hours_attended, created_at,
      volunteer:volunteer_id(id, name, email, department, ref_code, mobile_no),
      activity:activity_id(id, title, activity_date, location, activity_type)
    `)
    .in('status', ['pending', 'rejected'])
    .order('created_at', { ascending: false });

  if (error) return errorResponse(error.message, 400);

  // photo_url column stores a private storage PATH, not a public URL —
  // mint a short-lived signed URL for each row just for this response.
  const withSignedUrls = await Promise.all((data || []).map(async (row) => {
    if (!row.photo_url) return row;
    const { data: signed } = await supabase.storage
      .from('attendance-photos')
      .createSignedUrl(row.photo_url, 300); // 5 minutes
    return { ...row, photo_url: signed?.signedUrl || null };
  }));

  return jsonResponse({ attendance: withSignedUrls });
}
