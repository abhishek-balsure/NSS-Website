import { createSupabaseAdmin, corsHeaders, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const supabase = createSupabaseAdmin(env);
    const body = await request.json();

    body.aadhar_no = body.aadhar_no.replace(/\s/g, '');

    if (!body.dob) {
      return errorResponse('Date of birth (dob) is required', 400);
    }
    const dobDate = new Date(body.dob);
    if (isNaN(dobDate.getTime())) {
      return errorResponse('Invalid Date of Birth format', 400);
    }
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    if (age < 15 || age > 80) {
      return errorResponse('Volunteer must be between 15 and 80 years old', 400);
    }

    const refCode = 'SRH-NSS-' + (body.academic_year || 'XXXX').split('-')[0] + '-' + Math.floor(1000 + Math.random() * 9000);
    body.ref_code = refCode;
    body.status = 'pending';
    body.medical = body.medical || 'None';

    const { data, error } = await supabase.from('volunteers').insert(body).select().single();

    if (error) {
      if (error.code === '23505') return errorResponse('Aadhar number already registered', 409);
      return errorResponse(error.message, 400);
    }

    return jsonResponse(data, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}