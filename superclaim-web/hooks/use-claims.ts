import { useQuery } from '@tanstack/react-query';

import { bffRequest } from '@/lib/api';
import type { ClaimListResponse, UsageCurrent } from '@/lib/types';

export function useClaims() {
  return useQuery({
    queryKey: ['claims'],
    queryFn: () => bffRequest<ClaimListResponse>('/api/control/claims'),
  });
}

export function useUsage() {
  return useQuery({
    queryKey: ['usage-current'],
    queryFn: () => bffRequest<UsageCurrent>('/api/control/usage/current'),
  });
}
