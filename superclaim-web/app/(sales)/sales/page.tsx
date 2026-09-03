'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2, CircleDollarSign, Wallet } from 'lucide-react';

import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { bffRequest } from '@/lib/api';
import type { CommissionSummary, DealerListResponse } from '@/lib/types';

export default function SalesOverviewPage() {
  const dealers = useQuery({
    queryKey: ['sales', 'dealers'],
    queryFn: () => bffRequest<DealerListResponse>('/api/control/sales/dealers'),
  });
  const commission = useQuery({
    queryKey: ['sales', 'commission', 'month'],
    queryFn: () => bffRequest<CommissionSummary>('/api/control/sales/commission?range=month'),
  });

  const rows = dealers.data?.dealers ?? [];
  const isLoading = dealers.isLoading || commission.isLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your dealers, revenue, and commission at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Dealers onboarded" value={rows.length} icon={Building2} />
            <StatCard
              label="Revenue this month"
              value={`$${(commission.data?.total_revenue ?? 0).toFixed(2)}`}
              icon={CircleDollarSign}
              hint="Across all your dealers"
            />
            <StatCard
              label="Commission this month"
              value={`$${(commission.data?.total_commission ?? 0).toFixed(2)}`}
              icon={Wallet}
              accent="positive"
              hint="Bonus + revenue share"
            />
          </>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Your dealers</h2>
          <Link href="/sales/dealers" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Dealer', 'Status', 'Claims processed', 'Revenue (month)', 'Last claim'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {dealers.isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-5 py-3.5"><div className="h-5 w-full animate-pulse rounded bg-muted" /></td></tr>
                ))}
              {rows.slice(0, 5).map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-5 py-3.5">
                    <Link href={`/sales/dealers/${d.id}`} className="font-medium text-primary hover:underline">
                      {d.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={d.is_active ? 'default' : 'secondary'} className="capitalize">{d.status}</Badge>
                  </td>
                  <td className="px-5 py-3.5">{d.claims_processed_total}</td>
                  <td className="px-5 py-3.5">${d.revenue_current_period.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{d.last_claim_at?.slice(0, 10) ?? '—'}</td>
                </tr>
              ))}
              {!dealers.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState
                      icon={Building2}
                      title="No dealers onboarded yet"
                      description="Onboard your first dealer to start earning commission."
                    />
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
