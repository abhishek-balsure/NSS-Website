import { jsonResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

  return jsonResponse({ user: context.admin });
}
