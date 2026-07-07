import { createSupabase, corsHeaders, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const supabase = createSupabase(env);
    const body = await request.json();

    body.aadhar_no = body.aadhar_no.replace(/\s/g, '');
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
