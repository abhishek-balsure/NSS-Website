import { getCookie, verifySessionToken } from './_lib/session'

type Env = {
  ADMIN_SESSION_SECRET: string
}

// Paths under /admin/ that must stay reachable WITHOUT a valid session,
// otherwise nobody could ever log in.
const PUBLIC_PATHS = new Set(['/admin/login.html', '/admin/api/login'])

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const path = url.pathname

  if (PUBLIC_PATHS.has(path)) {
    return context.next()
  }

  const token = getCookie(context.request, 'admin_session')
  const valid = await verifySessionToken(token, context.env.ADMIN_SESSION_SECRET)

  if (!valid) {
    if (path.startsWith('/admin/api/')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return Response.redirect(`${url.origin}/admin/login.html`, 302)
  }

  return context.next()
}
