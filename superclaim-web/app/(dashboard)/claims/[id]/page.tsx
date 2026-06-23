'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Gauge, ShieldAlert, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { bffRequest } from '@/lib/api';
import type { ClaimDecisionResult } from '@/lib/types';

export default function ClaimDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['claim', params.id],
    queryFn: () => bffRequest<ClaimDecisionResult>(`/api/control/claims/${encodeURIComponent(params.id)}`),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading claim…</p>;
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!data) return <p className="text-sm text-destructive">Claim not found</p>;

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
