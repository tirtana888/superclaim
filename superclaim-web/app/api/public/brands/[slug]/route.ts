import { NextResponse } from 'next/server';

import { getApiBase } from '@/lib/api';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const res = await fetch(`${getApiBase()}/api/public/brands/${encodeURIComponent(params.slug)}`, {
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
