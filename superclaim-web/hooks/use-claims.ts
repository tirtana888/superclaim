import { useQuery } from '@tanstack/react-query';

import { bffRequest } from '@/lib/api';
import type { ClaimListResponse, UsageRecord } from '@/lib/types';

export function useClaims() {
  return useQuery({
    queryKey: ['claims'],
    queryFn: () => bffRequest<ClaimListResponse>('/api/control/claims'),
  });
}

export function useUsage() {
  return useQuery({
    queryKey: ['usage-current'],
    queryFn: () => bffRequest<UsageRecord>('/api/control/usage/current'),
  });
}

export function useUsageHistory() {
  return useQuery({
    queryKey: ['usage-history'],
    queryFn: () => bffRequest<UsageRecord[]>('/api/control/usage'),
  });
}
