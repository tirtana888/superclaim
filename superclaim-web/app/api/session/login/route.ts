import { NextResponse } from 'next/server';

import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth';
import { getApiBase } from '@/lib/api';
import type { AuthResponse } from '@/lib/types';

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${getApiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as AuthResponse & { detail?: unknown };
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const response = NextResponse.json({
    user: data.user,
    tenant: data.tenant,
    platform_admin: data.platform_admin,
  });
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set(ACCESS_COOKIE, data.tokens.access_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 30,
  });
  response.cookies.set(REFRESH_COOKIE, data.tokens.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}
