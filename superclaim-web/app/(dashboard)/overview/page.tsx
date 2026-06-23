'use client';

import Link from 'next/link';

import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { useClaims, useUsage } from '@/hooks/use-claims';

export default function OverviewPage() {
  const claims = useClaims();
  const usage = useUsage();
  const rows = claims.data?.claims ?? [];
  const approved = rows.filter((c) => {
    const a = c.metadata?.analysis_result as { decision?: string } | undefined;
    return a?.decision === 'APPROVE';
  }).length;
  const review = rows.filter((c) => c.status === 'processing' || c.status === 'review').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Claims activity and usage for your workspace</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {claims.isLoading || usage.isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total claims" value={rows.length} />
            <StatCard label="Approved" value={approved} />
            <StatCard label="Needs review" value={review} />
            <StatCard
              label="AI cost (period)"
              value={`$${(usage.data?.ai_cost_total ?? 0).toFixed(2)}`}
              hint={usage.data?.period}
            />
          </>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent claims</h2>
          <Link href="/claims" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {['Claim ID', 'Status', 'Decision', 'Fraud', 'Created'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row) => {
                const analysis = row.metadata?.analysis_result as { decision?: string; fraud_score?: number } | undefined;
                return (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link href={`/claims/${row.external_claim_id}`} className="text-primary hover:underline">
                      {row.external_claim_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    {analysis?.decision ? (
                      <Badge variant={analysis.decision === 'APPROVE' ? 'default' : analysis.decision === 'REJECT' ? 'destructive' : 'secondary'}>
                        {analysis.decision}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">{analysis?.fraud_score?.toFixed(2) ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.created_at?.slice(0, 10) ?? '—'}</td>
                </tr>
              );})}
              {!claims.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No claims yet. Submit one from your integration or hosted claim page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
