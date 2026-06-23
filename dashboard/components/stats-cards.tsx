'use client';

import { Activity, Clock, DollarSign, ShieldAlert, TrendingUp } from 'lucide-react';

import type { DashboardStats } from '@/lib/types';
import { formatMs, formatUsd } from '@/lib/utils';

interface StatsCardsProps {
  stats: DashboardStats;
}

const cards = [
  {
    key: 'totalToday' as const,
    label: 'Claims today',
    icon: Activity,
    format: (v: number) => String(v),
  },
  {
    key: 'autoApprovedPct' as const,
    label: 'Auto-approved',
    icon: TrendingUp,
    format: (v: number) => `${v}%`,
  },
  {
    key: 'fraudDetected' as const,
    label: 'Fraud flagged',
    icon: ShieldAlert,
    format: (v: number) => String(v),
  },
  {
    key: 'avgProcessingMs' as const,
    label: 'Avg processing',
    icon: Clock,
    format: (v: number) => formatMs(v),
  },
  {
    key: 'totalAiCostUsd' as const,
    label: 'Total AI cost',
    icon: DollarSign,
    format: (v: number) => formatUsd(v),
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map(({ key, label, icon: Icon, format }) => (
        <div key={key} className="card">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">{label}</span>
            <Icon className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-semibold">{format(stats[key])}</p>
        </div>
      ))}
    </div>
  );
}
