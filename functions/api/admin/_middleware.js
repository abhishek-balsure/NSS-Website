import { verifyAdminSession, jsonResponse } from '../../_utils.js';

const PUBLIC_PATHS = ['/api/admin/login', '/api/admin/logout'];

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Allow login and logout without a session
  if (PUBLIC_PATHS.some(p => url.pathname === p)) {
    return next();
  }

  const session = await verifyAdminSession(request, env);
  if (!session) {
    return jsonResponse({ error: 'Unauthorized — login required' }, 401);
  }

  // Attach admin info so downstream handlers can use context.admin
  context.admin = session;

  return next();
}
