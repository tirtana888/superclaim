'use client';

import { useCallback, useEffect, useState } from 'react';

import { ClaimDetailView } from '@/components/claim-detail-view';
import type { ClaimRow } from '@/lib/types';

const POLL_MS = 3000;

export function ClaimDetailPage({ claimId }: { claimId: string }) {
  const [claim, setClaim] = useState<ClaimRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchClaim = useCallback(async () => {
    try {
      const res = await fetch(`/api/claims/${claimId}`, { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to fetch claim');
      }
      const data = await res.json();
      setClaim(data.claim);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, [claimId]);

  useEffect(() => {
    fetchClaim();
    const interval = setInterval(fetchClaim, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchClaim]);

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
