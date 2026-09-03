'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';

import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsIndicator, TabsList, TabsTab } from '@/components/ui/tabs';
import { bffRequest } from '@/lib/api';
import type { CommissionRange, CommissionSummary } from '@/lib/types';

const RANGE_TABS: { value: CommissionRange; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

export default function SalesCommissionPage() {
  const [range, setRange] = useState<CommissionRange>('month');
  const { data, isLoading } = useQuery({
    queryKey: ['sales', 'commission', range],
    queryFn: () => bffRequest<CommissionSummary>(`/api/control/sales/commission?range=${range}`),
  });

  const rows = data?.dealers ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Commission</h1>
        <p className="mt-1 text-sm text-muted-foreground">Onboarding bonuses and revenue share, per dealer</p>
      </div>

      <Tabs value={range} onValueChange={(v) => setRange(v as CommissionRange)}>
        <TabsList>
          {RANGE_TABS.map((t) => (
            <TabsTab key={t.value} value={t.value}>{t.label}</TabsTab>
          ))}
          <TabsIndicator />
        </TabsList>
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Revenue commission" value={`$${(data?.total_revenue_commission ?? 0).toFixed(2)}`} />
            <StatCard label="Onboarding bonuses" value={`$${(data?.total_onboarding_bonus ?? 0).toFixed(2)}`} />
            <StatCard
              label="Total commission"
              value={`$${(data?.total_commission ?? 0).toFixed(2)}`}
              icon={Wallet}
              accent="positive"
            />
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {['Dealer', 'Claims processed', 'Revenue', 'Revenue commission', 'Onboarding bonus'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Loading…</td></tr>}
            {rows.map((d) => (
              <tr key={d.tenant_id} className="transition-colors hover:bg-muted/30">
                <td className="px-5 py-3.5 font-medium">{d.tenant_name}</td>
                <td className="px-5 py-3.5">{d.claims_processed}</td>
                <td className="px-5 py-3.5">${d.revenue.toFixed(2)}</td>
                <td className="px-5 py-3.5">${d.revenue_commission.toFixed(2)}</td>
                <td className="px-5 py-3.5">{d.onboarding_bonus > 0 ? `$${d.onboarding_bonus.toFixed(2)}` : '—'}</td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState
                    icon={Wallet}
                    title="No commission activity yet"
                    description="Onboard a dealer or wait for claims to process to see commission here."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
