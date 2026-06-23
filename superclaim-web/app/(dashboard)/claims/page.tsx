'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsIndicator, TabsList, TabsTab } from '@/components/ui/tabs';
import { useClaims } from '@/hooks/use-claims';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
];

export default function ClaimsPage() {
  const { data, isLoading, error } = useClaims();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const rows = useMemo(() => {
    let list = data?.claims ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.external_claim_id.toLowerCase().includes(q) ||
          (c.serial_number_input ?? '').toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter);
    }
    return list;
  }, [data, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Claims</h1>
        <p className="mt-1 text-sm text-muted-foreground">All warranty claims for your workspace</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(String(v))}>
          <TabsList>
            {STATUS_TABS.map((t) => (
              <TabsTab key={t.value} value={t.value}>
                {t.label}
              </TabsTab>
            ))}
            <TabsIndicator />
          </TabsList>
        </Tabs>
        <Input placeholder="Search claim or serial…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {['Claim ID', 'Category', 'Serial', 'Status', 'Decision', 'Fraud', ''].map((h) => (
                <th key={h || 'action'} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="transition-colors hover:bg-muted/30">
                  <td colSpan={7} className="px-5 py-3.5"><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))}
            {rows.map((row) => {
              const analysis = row.metadata?.analysis_result as { decision?: string; fraud_score?: number } | undefined;
              return (
                <tr key={row.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-5 py-3.5 font-medium">{row.external_claim_id}</td>
                  <td className="px-5 py-3.5">{row.device_category ?? '—'}</td>
                  <td className="px-5 py-3.5">{row.serial_number_input ?? '—'}</td>
                  <td className="px-5 py-3.5">{row.status}</td>
                  <td className="px-5 py-3.5">
                    {analysis?.decision ? (
                      <Badge variant={analysis.decision === 'APPROVE' ? 'default' : analysis.decision === 'REJECT' ? 'destructive' : 'secondary'}>
                        {analysis.decision}
                      </Badge>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3.5">{analysis?.fraud_score?.toFixed(2) ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <Link href={`/claims/${row.external_claim_id}`} className="text-primary hover:underline">View</Link>
                  </td>
                </tr>
              );
            })}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No claims found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
