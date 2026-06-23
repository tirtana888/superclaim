'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

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
        <Link href="/claims" className="text-sm text-primary hover:underline">
          ← Back to claims
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{data.claim_id}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Decision</p>
          <p className="mt-1 font-medium">{data.decision}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Fraud score</p>
          <p className="mt-1 font-medium">{data.fraud_score.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Confidence</p>
          <p className="mt-1 font-medium">{data.confidence_score.toFixed(2)}</p>
        </div>
      </div>

      {rules.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Policy rules</h2>
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.rule_id} className="flex items-start justify-between rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{rule.rule_id}</p>
                  <p className="text-muted-foreground">{rule.reason}</p>
                </div>
                <Badge variant={rule.passed ? 'default' : 'destructive'}>{rule.passed ? 'Pass' : 'Fail'}</Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.reasons.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Reasons</h2>
          <ul className="space-y-2 text-sm">
            {data.reasons.map((r) => (
              <li key={r.code} className="rounded-lg border border-border p-3">
                <span className="font-medium">{r.code}</span> — {r.description}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
