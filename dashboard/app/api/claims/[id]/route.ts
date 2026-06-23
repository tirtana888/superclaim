import { NextResponse } from 'next/server';

import { getSupabaseAdmin, getTenantId } from '@/lib/supabase-server';
import type { ClaimRow } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = getSupabaseAdmin();
    const tenantId = getTenantId();

    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('external_claim_id', params.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json(
      { claim: data as ClaimRow },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
