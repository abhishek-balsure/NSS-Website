import { verifyVolunteerSession, jsonResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env, next } = context;

  const session = await verifyVolunteerSession(request, env);
  if (!session) {
    return jsonResponse({ error: 'Unauthorized — please log in' }, 401);
  }

  context.data.volunteer = session;
  return next();
}
