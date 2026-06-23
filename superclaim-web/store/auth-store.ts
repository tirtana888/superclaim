import { create } from 'zustand';

import type { MeResponse, PlatformAdmin, Tenant, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  platformAdmin: PlatformAdmin | null;
  hydrated: boolean;
  setSession: (data: MeResponse) => void;
  clear: () => void;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  platformAdmin: null,
  hydrated: false,
  setSession: (data) =>
    set({
      user: data.user,
      tenant: data.tenant,
      platformAdmin: data.platform_admin,
      hydrated: true,
    }),
  clear: () => set({ user: null, tenant: null, platformAdmin: null, hydrated: true }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
