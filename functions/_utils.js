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

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
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
    'Set-Cookie': `${ADMIN_SID}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=${SID_MAX_AGE}`,
  };
}

export function clearAdminCookieHeaders() {
  return {
    'Set-Cookie': `${ADMIN_SID}=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0`,
  };
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
    'Set-Cookie': `${VOL_SID}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/api/volunteer; Max-Age=${SID_MAX_AGE}`,
  };
}

export function clearVolunteerCookieHeaders() {
  return {
    'Set-Cookie': `${VOL_SID}=; HttpOnly; Secure; SameSite=Strict; Path=/api/volunteer; Max-Age=0`,
  };
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
