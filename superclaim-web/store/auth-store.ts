import { create } from 'zustand';

import type { MeResponse, PlatformAdmin, SalesRep, Tenant, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  platformAdmin: PlatformAdmin | null;
  salesRep: SalesRep | null;
  hydrated: boolean;
  setSession: (data: MeResponse) => void;
  clear: () => void;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  platformAdmin: null,
  salesRep: null,
  hydrated: false,
  setSession: (data) =>
    set({
      user: data.user,
      tenant: data.tenant,
      platformAdmin: data.platform_admin,
      salesRep: data.sales_rep,
      hydrated: true,
    }),
  clear: () =>
    set({ user: null, tenant: null, platformAdmin: null, salesRep: null, hydrated: true }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
