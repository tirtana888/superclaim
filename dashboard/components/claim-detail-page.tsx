'use client';

import { useEffect, useRef, useState } from 'react';

import { ClaimDetailView } from '@/components/claim-detail-view';
import type { ClaimRow } from '@/lib/types';

const POLL_MS = 3000;

function isClaimDone(claim: ClaimRow | null): boolean {
  if (!claim) return false;
  return Boolean(
    claim.metadata?.analysis_result ||
      (claim.status && claim.status !== 'processing'),
  );
}

export function ClaimDetailPage({ claimId }: { claimId: string }) {
  const [claim, setClaim] = useState<ClaimRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    let active = true;

    async function fetchClaim() {
      try {
        const res = await fetch(`/api/claims/${claimId}`, { cache: 'no-store' });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? 'Failed to fetch claim');
        }
        const data = await res.json();
        if (!active) return;

        const nextClaim = data.claim as ClaimRow;
        setClaim(nextClaim);
        setError(null);

        if (isClaimDone(nextClaim) && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = undefined;
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    }

    void fetchClaim();
    pollRef.current = setInterval(() => void fetchClaim(), POLL_MS);

    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [claimId]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!claim) {
    return <div className="card text-[hsl(var(--muted-foreground))]">Loading claim…</div>;
  }

  return <ClaimDetailView claim={claim} />;
}
