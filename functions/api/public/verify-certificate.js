import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const url = new URL(request.url);
  const refCode = url.searchParams.get('ref_code');

  if (!refCode) {
    return errorResponse('Reference code is required', 400);
  }

  const supabase = createSupabaseAdmin(env);

  try {
    // 1. Fetch volunteer by Reference Code
    const { data: volunteer, error: volErr } = await supabase
      .from('volunteers')
      .select('id, name, department, class, roll_no, academic_year, status')
      .eq('ref_code', refCode.trim().toUpperCase())
      .maybeSingle();

    if (volErr) return errorResponse(volErr.message, 400);
    if (!volunteer) return errorResponse('Invalid Reference Code. Certificate not found.', 404);

    // 2. Calculate approved hours
    const { data: attendance, error: attErr } = await supabase
      .from('attendance')
      .select('hours_attended')
      .eq('volunteer_id', volunteer.id)
      .eq('status', 'approved');

    if (attErr) return errorResponse(attErr.message, 400);

    const totalHours = (attendance || []).reduce((sum, item) => sum + (parseFloat(item.hours_attended) || 0), 0);
    const MIN_CERT_HOURS = 10;

    if (totalHours >= MIN_CERT_HOURS) {
      return jsonResponse({
        success: true,
        verified: true,
        volunteer: {
          name: volunteer.name,
          department: volunteer.department,
          class: volunteer.class,
          roll_no: volunteer.roll_no,
          academic_year: volunteer.academic_year,
          hours: totalHours
        }
      });
    } else {
      return jsonResponse({
        success: true,
        verified: false,
        message: `This student is enrolled, but has not completed the required minimum of ${MIN_CERT_HOURS} hours (currently has ${totalHours.toFixed(1)} hours).`
      });
    }
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
