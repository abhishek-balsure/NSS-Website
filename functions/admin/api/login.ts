import { createSessionToken } from '../_lib/session'

type Env = {
  ADMIN_PASSWORD: string
  ADMIN_SESSION_SECRET: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { password } = await context.request.json<{ password?: string }>()

    if (!password || password !== context.env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Incorrect password.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const token = await createSessionToken(context.env.ADMIN_SESSION_SECRET)

    const headers = new Headers({ 'Content-Type': 'application/json' })
    headers.append(
      'Set-Cookie',
      `admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=43200`
    )

    return new Response(JSON.stringify({ success: true }), { headers })
  } catch (err) {
    console.error('Admin login error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
