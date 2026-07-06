// Small HMAC-signed session token helper for the admin area.
// Token format: "<expiryEpochSeconds>.<base64url HMAC-SHA256 signature>"
// No external deps — uses the Web Crypto API available in the Workers runtime.

function toBase64Url(bytes: ArrayBuffer): string {
  const b = btoa(String.fromCharCode(...new Uint8Array(bytes)))
  return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(secret: string, message: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
}

const SESSION_TTL_SECONDS = 12 * 60 * 60 // 12 hours

export async function createSessionToken(secret: string): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const sig = toBase64Url(await hmac(secret, String(expiry)))
  return `${expiry}.${sig}`
}

export async function verifySessionToken(token: string | null, secret: string): Promise<boolean> {
  if (!token) return false
  const [expiryStr, sig] = token.split('.')
  if (!expiryStr || !sig) return false

  const expiry = Number(expiryStr)
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return false

  const expectedSig = toBase64Url(await hmac(secret, expiryStr))
  // Constant-time-ish comparison
  if (sig.length !== expectedSig.length) return false
  let mismatch = 0
  for (let i = 0; i < sig.length; i++) {
    mismatch |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i)
  }
  return mismatch === 0
}

export function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}
