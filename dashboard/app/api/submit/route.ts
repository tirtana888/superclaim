import { NextResponse } from 'next/server';

import { checkEngineHealth, getEngineUrl, submitClaimToEngine } from '@/lib/engine';
import type { SubmitClaimPayload } from '@/lib/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const online = await checkEngineHealth();
  return NextResponse.json({ online, url: getEngineUrl() });
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
    if (payload.images.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 images per claim' }, { status: 400 });
    }
    if (!payload.serial_number_input?.trim()) {
      return NextResponse.json({ error: 'serial_number_input is required' }, { status: 400 });
    }
    if (!payload.purchase_date?.trim()) {
      return NextResponse.json({ error: 'purchase_date is required' }, { status: 400 });
    }
    if (!payload.claim_date?.trim()) {
      return NextResponse.json({ error: 'claim_date is required' }, { status: 400 });
    }
    if (!payload.damage_description?.trim()) {
      return NextResponse.json({ error: 'damage_description is required' }, { status: 400 });
    }

    const result = await submitClaimToEngine(payload);
    return NextResponse.json(result, { status: 202 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Submit failed';
    console.error('[api/submit]', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
