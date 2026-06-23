import { NextResponse } from 'next/server';

import { getSupabaseAdmin, getTenantId } from '@/lib/supabase-server';
import type { ClaimRow, DashboardStats } from '@/lib/types';

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function computeStats(claims: ClaimRow[]): DashboardStats {
  const todayStart = startOfTodayIso();
  const todayClaims = claims.filter((c) => c.created_at >= todayStart);
  const completed = claims.filter((c) => c.metadata?.analysis_result);
  const approved = completed.filter(
    (c) => c.metadata.analysis_result?.decision === 'APPROVE',
  );
  const fraudDetected = completed.filter(
    (c) => (c.metadata.analysis_result?.fraud_score ?? 0) >= 0.65,
  ).length;

  const processingTimes = completed
    .map((c) => c.metadata.analysis_result?.processing_time_ms ?? 0)
    .filter((ms) => ms > 0);
  const aiCosts = completed.map((c) => c.metadata.analysis_result?.ai_cost_usd ?? 0);

  return {
    totalToday: todayClaims.length,
    autoApprovedPct:
      completed.length > 0
        ? Math.round((approved.length / completed.length) * 100)
        : 0,
    fraudDetected,
    avgProcessingMs:
      processingTimes.length > 0
        ? Math.round(
            processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length,
          )
        : 0,
    totalAiCostUsd: aiCosts.reduce((a, b) => a + b, 0),
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const tenantId = getTenantId();

    const { data, error } = await supabase
      .from('claims')
      .select(
        'id, external_claim_id, status, device_category, serial_number_input, created_at, metadata',
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const claims = (data ?? []) as ClaimRow[];
    return NextResponse.json({
      claims,
      stats: computeStats(claims),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
