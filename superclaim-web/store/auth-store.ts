import { create } from 'zustand';

import type { MeResponse, Tenant, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  hydrated: boolean;
  setSession: (data: MeResponse) => void;
  clear: () => void;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  hydrated: false,
  setSession: (data) =>
    set({
      user: data.user,
      tenant: data.tenant,
      hydrated: true,
    }),
  clear: () => set({ user: null, tenant: null, hydrated: true }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
