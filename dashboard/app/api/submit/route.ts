import { NextResponse } from 'next/server';

import { checkEngineHealth, submitClaimToEngine } from '@/lib/engine';
import type { SubmitClaimPayload } from '@/lib/engine';

export async function GET() {
  const online = await checkEngineHealth();
  return NextResponse.json({ online, url: process.env.SUPERCLAIM_API_URL });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SubmitClaimPayload;

    if (!payload.claim_id?.trim()) {
      return NextResponse.json({ error: 'claim_id is required' }, { status: 400 });
    }
    if (!payload.device_category?.trim()) {
      return NextResponse.json({ error: 'device_category is required' }, { status: 400 });
    }
    if (!payload.images?.length) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    const result = await submitClaimToEngine(payload);
    return NextResponse.json(result, { status: 202 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Submit failed' },
      { status: 502 },
    );
  }
}
