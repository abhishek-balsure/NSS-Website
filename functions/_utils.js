import { createClient } from '@supabase/supabase-js';

const ADMIN_SID = 'nss_sid';
const VOL_SID   = 'nss_v_sid';
const SID_MAX_AGE = 86400;

export function createSupabase(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}

export function createSupabaseAdmin(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
}

// Replace 'https://your-real-domain.com' with your actual production
// domain (custom domain if you have one, otherwise your *.pages.dev URL).
// Preview deployments (*.nss-website.pages.dev) are allowed automatically
// so branch testing still works.
const ALLOWED_ORIGIN_SUFFIXES = ['.nss-website.pages.dev'];
const ALLOWED_ORIGINS = ['https://your-real-domain.com'];

export function corsHeaders(request) {
  const origin = request?.headers?.get('Origin') || '';
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    ALLOWED_ORIGIN_SUFFIXES.some(suffix => origin.endsWith(suffix));

  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
  if (isAllowed) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// ── HMAC helpers (shared) ──

function parseCookies(request) {
  const header = request.headers.get('Cookie');
  if (!header) return {};
  const result = {};
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const name = pair.substring(0, idx).trim();
      const val = pair.substring(idx + 1).trim();
      result[name] = decodeURIComponent(val);
    }
  });
  return result;
}

function b64url(input) {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(input) {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  while (input.length % 4) input += '=';
  return atob(input);
}

async function _sign(payload, secret) {
  const encoder = new TextEncoder();
  const data = b64url(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return data + '.' + b64url(String.fromCharCode(...new Uint8Array(sig)));
}

async function _verify(raw, secret) {
  const dot = raw.indexOf('.');
  if (dot === -1) return null;
  const data = raw.substring(0, dot);
  const sig = raw.substring(dot + 1);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['verify']
  );
  const valid = await crypto.subtle.verify(
    'HMAC', key,
    Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
    encoder.encode(data)
  );
  if (!valid) return null;
  let payload;
  try { payload = JSON.parse(b64urlDecode(data)); } catch { return null; }
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// ── Admin session ──

export async function signSessionPayload(payload, secret) {
  return _sign(payload, secret);
}

export async function verifyAdminSession(request, env) {
  const cookies = parseCookies(request);
  const raw = cookies[ADMIN_SID];
  if (!raw) return null;
  return _verify(raw, env.SESSION_SECRET);
}

export function setAdminCookieHeaders(token) {
  return {
    'Set-Cookie': `${ADMIN_SID}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=${SID_MAX_AGE}`,
  };
}

export function clearAdminCookieHeaders() {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  // Clear at every path this cookie has ever been set at (current /api, plus
  // the old /api/admin from before that change) — a plain object can only
  // hold one Set-Cookie value, which is exactly why old cookies were never
  // actually being cleared. Headers.append correctly sends multiple.
  for (const path of ['/api', '/api/admin']) {
    headers.append('Set-Cookie', `${ADMIN_SID}=; HttpOnly; Secure; SameSite=Strict; Path=${path}; Max-Age=0`);
  }
  return headers;
}

// ── Volunteer session ──

export async function verifyVolunteerSession(request, env) {
  const cookies = parseCookies(request);
  const raw = cookies[VOL_SID];
  if (!raw) return null;
  return _verify(raw, env.SESSION_SECRET);
}

export function setVolunteerCookieHeaders(token) {
  return {
    'Set-Cookie': `${VOL_SID}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=${SID_MAX_AGE}`,
  };
}

export function clearVolunteerCookieHeaders() {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const path of ['/api', '/api/volunteer']) {
    headers.append('Set-Cookie', `${VOL_SID}=; HttpOnly; Secure; SameSite=Strict; Path=${path}; Max-Age=0`);
  }
  return headers;
}

// ── Legacy Bearer-token helper (for non-session routes) ──

export async function getUser(supabase, request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// ── Rate limiting (login brute-force protection) ──
// Keyed by account (email), not IP — a college campus WiFi puts many
// students behind the same public IP, so IP-based limiting would lock
// out everyone on that network after one person mistypes a password.
// Per-account limiting stops brute-forcing one account without that
// collateral damage. Requires a KV namespace bound as RATE_LIMIT_KV;
// if it isn't bound yet, this fails OPEN (allows the request) so login
// keeps working while you set the binding up.
export async function checkRateLimit(env, key, maxAttempts = 5, windowSeconds = 300) {
  if (!env.RATE_LIMIT_KV) return { allowed: true };
  const now = Date.now();
  const raw = await env.RATE_LIMIT_KV.get(key);
  let record = raw ? JSON.parse(raw) : null;
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + windowSeconds * 1000 };
  }
  if (record.count >= maxAttempts) {
    return { allowed: false, retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000) };
  }
  record.count += 1;
  await env.RATE_LIMIT_KV.put(key, JSON.stringify(record), { expirationTtl: windowSeconds });
  return { allowed: true };
}

export async function resetRateLimit(env, key) {
  if (!env.RATE_LIMIT_KV) return;
  await env.RATE_LIMIT_KV.delete(key);
}
