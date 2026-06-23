import { NextResponse } from 'next/server';

import { getApiBase } from '@/lib/api';

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const body = await request.text();
  const res = await fetch(`${getApiBase()}/api/public/brands/${encodeURIComponent(params.slug)}/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
