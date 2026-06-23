import { NextRequest, NextResponse } from 'next/server';

import { controlFetch } from '@/lib/control-api';

async function proxy(request: NextRequest, params: { path: string[] }, method: string) {
  const path = `/api/admin/${params.path.join('/')}`;
  const init: RequestInit = { method };
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await request.text();
  }
  const res = await controlFetch(path, init);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return proxy(request, params, 'GET');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return proxy(request, params, 'PATCH');
}
