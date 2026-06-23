'use client';

import { useEffect, useState } from 'react';

export default function UsagePage() {
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/control/usage/current');
      const data = await res.json();
      if (!res.ok) {
        setError(data?.detail?.message ?? 'Failed to load usage');
        return;
      }
      setUsage(data);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Usage & billing</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {usage && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[hsl(var(--border))] p-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Period</p>
            <p className="text-xl font-semibold">{String(usage.period)}</p>
          </div>
          <div className="rounded-xl border border-[hsl(var(--border))] p-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Claims processed</p>
            <p className="text-xl font-semibold">{String(usage.claims_processed)}</p>
          </div>
          <div className="rounded-xl border border-[hsl(var(--border))] p-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">AI cost (USD)</p>
            <p className="text-xl font-semibold">{String(usage.ai_cost_total)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
