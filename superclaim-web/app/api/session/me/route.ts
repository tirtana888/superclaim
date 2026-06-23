import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { ACCESS_COOKIE } from '@/lib/auth';
import { getApiBase } from '@/lib/api';

export async function GET() {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ detail: { message: 'Not authenticated' } }, { status: 401 });
  }
  const res = await fetch(`${getApiBase()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
