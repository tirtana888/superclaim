'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, CalendarClock, CircleDollarSign, ListChecks } from 'lucide-react';

import { StatCard } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { bffRequest } from '@/lib/api';
import type { DealerDetail } from '@/lib/types';

export default function SalesDealerDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales', 'dealer', params.id],
    queryFn: () => bffRequest<DealerDetail>(`/api/control/sales/dealers/${encodeURIComponent(params.id)}`),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading dealer…</p>;
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!data) return <p className="text-sm text-destructive">Dealer not found</p>;

  const chartData = data.revenue_history.map((r) => ({
    period: r.period,
    claims: r.claims_processed,
    revenue: r.revenue,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/sales/dealers" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dealers
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          <Badge variant={data.is_active ? 'default' : 'secondary'} className="capitalize">{data.status}</Badge>
          <span className="text-sm capitalize text-muted-foreground">{data.plan_tier} plan</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Claims processed (all time)" value={data.claims_processed_total} icon={ListChecks} />
        <StatCard
          label="Revenue this month"
          value={`$${data.revenue_current_period.toFixed(2)}`}
          icon={CircleDollarSign}
        />
        <StatCard
          label="Last claim"
          value={data.last_claim_at?.slice(0, 10) ?? '—'}
          icon={CalendarClock}
        />
      </div>

      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Revenue by month</h2>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No processed claims yet</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
