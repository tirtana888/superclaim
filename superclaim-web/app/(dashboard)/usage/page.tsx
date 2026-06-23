'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import { useUsage, useUsageHistory } from '@/hooks/use-claims';

export default function UsagePage() {
  const { data, isLoading } = useUsage();
  const history = useUsageHistory();

  const chartData = (history.data ?? []).map((r) => ({
    period: r.period,
    claims: r.claims_processed,
    cost: r.ai_cost_total,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">Billing period {data?.period ?? '—'}</p>
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
            <StatCard label="Claims processed" value={data?.claims_processed ?? 0} />
            <StatCard label="AI cost" value={`$${(data?.ai_cost_total ?? 0).toFixed(2)}`} />
            <StatCard label="Billable" value={`$${(data?.billable_amount ?? 0).toFixed(2)}`} />
          </>
        )}
      </div>

      <section className="rounded-xl border border-border p-5">
        <h2 className="mb-4 text-lg font-medium">Claims by month</h2>
        {history.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading chart…</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No usage history yet</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="claims" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
