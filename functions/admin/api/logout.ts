export const onRequestPost: PagesFunction = async () => {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.append(
    'Set-Cookie',
    'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=0'
  )
  return new Response(JSON.stringify({ success: true }), { headers })
}
