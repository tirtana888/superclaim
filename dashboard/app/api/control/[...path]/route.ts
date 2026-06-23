import { NextRequest, NextResponse } from 'next/server';

import { controlFetch } from '@/lib/control-api';

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = `/${params.path.join('/')}`;
  const res = await controlFetch(`/api${path}`);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = `/${params.path.join('/')}`;
  const body = await request.text();
  const res = await controlFetch(`/api${path}`, { method: 'POST', body });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
