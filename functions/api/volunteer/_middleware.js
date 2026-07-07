import { verifyVolunteerSession, jsonResponse } from '../../_utils.js';

const PUBLIC_PATHS = ['/api/volunteer/signup', '/api/volunteer/login', '/api/volunteer/logout'];

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (PUBLIC_PATHS.some(p => url.pathname === p)) {
    return next();
  }

  const session = await verifyVolunteerSession(request, env);
  if (!session) {
    return jsonResponse({ error: 'Unauthorized — please log in' }, 401);
  }

  context.data.volunteer = session;
  return next();
}
