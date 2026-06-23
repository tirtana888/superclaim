import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { ACCESS_COOKIE } from '@/lib/auth';
import { getApiBase } from '@/lib/api';

async function proxy(request: NextRequest, params: { path: string[] }, method: string) {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ detail: { message: 'Not authenticated' } }, { status: 401 });
  }
  const path = `/api/${params.path.join('/')}`;
  const init: RequestInit = {
    method,
    headers: { Authorization: `Bearer ${token}` },
  };
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await request.text();
    const ct = request.headers.get('content-type');
    if (ct) (init.headers as Record<string, string>)['Content-Type'] = ct;
  }
  const res = await fetch(`${getApiBase()}${path}`, { ...init, cache: 'no-store' });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params, 'GET');
}

export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params, 'POST');
}

export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params, 'PATCH');
}

export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params, 'DELETE');
}
