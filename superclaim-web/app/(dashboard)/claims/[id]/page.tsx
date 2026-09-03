'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Gauge, Loader2, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { bffRequest } from '@/lib/api';
import type { ClaimDecisionResult } from '@/lib/types';

export default function ClaimDetailPage({ params }: { params: { id: string } }) {
  const { data, error, failureCount, refetch } = useQuery({
    queryKey: ['claim', params.id],
    queryFn: () => bffRequest<ClaimDecisionResult>(`/api/control/claims/${encodeURIComponent(params.id)}`),
    // Poll every 4s while the decision isn't ready yet; stop once it arrives.
    refetchInterval: (query) => (query.state.data ? false : 4000),
    retry: 1,
  });

  // No result yet — the claim is still moving through the AI pipeline.
  if (!data) {
    const stalled = failureCount > 5;
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/claims" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to claims
        </Link>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card px-6 py-16 text-center shadow-sm">
          <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <h1 className="text-lg font-semibold tracking-tight">Analyzing claim…</h1>
          </div>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {stalled
              ? 'This is taking longer than usual. The claim may still be processing, or the reference may be invalid.'
              : 'Our AI is running vision, OCR, policy and fraud checks. This page updates automatically when the decision is ready.'}
          </p>
          <p className="mt-4 font-mono text-xs text-muted-foreground">{params.id}</p>
          {stalled && (
            <div className="mt-5 flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry now
              </Button>
            </div>
          )}
          {stalled && error && (
            <p className="mt-3 text-xs text-destructive">{error.message}</p>
          )}
        </div>
      </div>
    );
  }

  const rules = (data.policy_result?.rules as { rule_id: string; passed: boolean; reason: string }[] | undefined) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/claims" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to claims
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{data.claim_id}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" /> Decision
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight">{data.decision}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldAlert className="h-4 w-4" /> Fraud score
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight">{data.fraud_score.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gauge className="h-4 w-4" /> Confidence
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight">{data.confidence_score.toFixed(2)}</p>
        </div>
      </div>

      {rules.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Policy rules</h2>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="divide-y divide-border/60">
              {rules.map((rule) => (
                <div key={rule.rule_id} className="flex items-start justify-between gap-4 p-4 text-sm transition-colors hover:bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">{rule.rule_id}</p>
                    <p className="mt-0.5 text-muted-foreground">{rule.reason}</p>
                  </div>
                  <Badge variant={rule.passed ? 'default' : 'destructive'}>{rule.passed ? 'Pass' : 'Fail'}</Badge>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {data.reasons.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Reasons</h2>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <ul className="divide-y divide-border/60">
              {data.reasons.map((r) => (
                <li key={r.code} className="p-4 text-sm transition-colors hover:bg-muted/30">
                  <span className="font-medium text-foreground">{r.code}</span>{' '}
                  <span className="text-muted-foreground">— {r.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
