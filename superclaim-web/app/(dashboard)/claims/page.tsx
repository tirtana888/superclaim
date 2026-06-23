'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useClaims } from '@/hooks/use-claims';

export default function ClaimsPage() {
  const { data, isLoading, error } = useClaims();
  const rows = data?.claims ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Claims</h1>
        <p className="mt-1 text-sm text-muted-foreground">All warranty claims for your workspace</p>
      </div>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {['Claim ID', 'Category', 'Serial', 'Status', 'Decision', 'Fraud', ''].map((h) => (
                <th key={h || 'action'} className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td colSpan={7} className="px-4 py-3">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {rows.map((row) => {
              const analysis = row.metadata?.analysis_result as { decision?: string; fraud_score?: number } | undefined;
              return (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{row.external_claim_id}</td>
                <td className="px-4 py-3">{row.device_category ?? '—'}</td>
                <td className="px-4 py-3">{row.serial_number_input ?? '—'}</td>
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
                <td className="px-4 py-3">
                  <Link href={`/claims/${row.external_claim_id}`} className="text-primary hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            );})}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No claims yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
