'use client';

import Link from 'next/link';

import type { ClaimRow } from '@/lib/types';
import { statusBadgeClass } from '@/lib/utils';

interface ClaimsTableProps {
  claims: ClaimRow[];
}

export function ClaimsTable({ claims }: ClaimsTableProps) {
  if (claims.length === 0) {
    return (
      <div className="card text-center text-[hsl(var(--muted-foreground))]">
        No claims yet. Submit via POST /v1/claims/analyze
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-[hsl(var(--border))] px-6 py-4">
        <h2 className="text-lg font-semibold">Recent claims</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))]/40 text-left text-[hsl(var(--muted-foreground))]">
            <tr>
              <th className="px-6 py-3 font-medium">Claim ID</th>
              <th className="px-6 py-3 font-medium">Device</th>
              <th className="px-6 py-3 font-medium">Serial</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Decision</th>
              <th className="px-6 py-3 font-medium">Fraud</th>
              <th className="px-6 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => {
              const analysis = claim.metadata?.analysis_result;
              const decision = analysis?.decision ?? '—';
              return (
                <tr
                  key={claim.id}
                  className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/20"
                >
                  <td className="px-6 py-3">
                    <Link
                      href={`/claims/${claim.external_claim_id}`}
                      className="font-medium text-emerald-400 hover:underline"
                    >
                      {claim.external_claim_id}
                    </Link>
                  </td>
                  <td className="px-6 py-3">{claim.device_category ?? '—'}</td>
                  <td className="px-6 py-3">{claim.serial_number_input ?? '—'}</td>
                  <td className="px-6 py-3">
                    <span className={statusBadgeClass(claim.status)}>{claim.status}</span>
                  </td>
                  <td className="px-6 py-3">
                    {analysis ? (
                      <span className={statusBadgeClass(decision)}>{decision}</span>
                    ) : (
                      <span className="badge-processing">processing</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {analysis ? analysis.fraud_score.toFixed(2) : '—'}
                  </td>
                  <td className="px-6 py-3 text-[hsl(var(--muted-foreground))]">
                    {new Date(claim.created_at).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
