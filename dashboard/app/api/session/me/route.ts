import { NextResponse } from 'next/server';

import { controlFetch } from '@/lib/control-api';

export async function GET() {
  const res = await controlFetch('/api/auth/me');
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data);
}
