'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { ClaimsTable } from '@/components/claims-table';
import { StatsCards } from '@/components/stats-cards';
import type { ClaimRow, DashboardStats } from '@/lib/types';

const POLL_MS = 3000;

const emptyStats: DashboardStats = {
  totalToday: 0,
  autoApprovedPct: 0,
  fraudDetected: 0,
  avgProcessingMs: 0,
  totalAiCostUsd: 0,
};

export function DashboardHome() {
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/claims', { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to fetch claims');
      }
      const data = await res.json();
      setClaims(data.claims);
      setStats(data.stats);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Claims Dashboard</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Trial & monitoring — submit klaim tanpa Globalbeli
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href="/submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            + Submit klaim trial
          </Link>
          {lastUpdated && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <StatsCards stats={stats} />
      <ClaimsTable claims={claims} />
    </div>
  );
}
