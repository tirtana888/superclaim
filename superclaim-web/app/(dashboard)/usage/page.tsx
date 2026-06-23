'use client';

import { useUsage } from '@/hooks/use-claims';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';

export default function UsagePage() {
  const { data, isLoading } = useUsage();

  return (
    <div className="space-y-6">
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
    </div>
  );
}
