import { cookies } from 'next/headers';

import { ACCESS_COOKIE, getApiBase } from '@/lib/session';

export async function getAccessToken(): Promise<string | null> {
  return cookies().get(ACCESS_COOKIE)?.value ?? null;
}

export async function controlFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    return new Response(JSON.stringify({ detail: { message: 'Not authenticated' } }), {
      status: 401,
    });
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${getApiBase()}${path}`, { ...init, headers, cache: 'no-store' });
}

export async function fetchClaimsWithJwt(): Promise<
  { status: 'ok'; claims: unknown[] } | { status: 'error'; message: string }
> {
  const res = await controlFetch('/api/claims');
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && body !== null && 'detail' in body
        ? String((body as { detail?: { message?: string } }).detail?.message ?? res.status)
        : `Request failed (${res.status})`;
    return { status: 'error', message: msg };
  }
  const record = body as { claims?: unknown[] };
  return { status: 'ok', claims: record.claims ?? [] };
}
