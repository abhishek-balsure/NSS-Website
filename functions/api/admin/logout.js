import { jsonResponse, clearAdminCookieHeaders } from '../../_utils.js';

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...clearAdminCookieHeaders(),
    },
  });
}
