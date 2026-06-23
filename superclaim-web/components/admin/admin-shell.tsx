'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { bffRequest } from '@/lib/api';
import type { MeResponse } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { platformAdmin, hydrated, setSession, setHydrated, clear } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const me = await bffRequest<MeResponse>('/api/session/me');
        if (cancelled) return;
        if (!me.platform_admin) {
          router.replace('/overview');
          return;
        }
        setSession(me);
      } catch {
        if (!cancelled) {
          clear();
          router.replace('/login');
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, setSession, setHydrated, clear]);

  async function logout() {
    try {
      await bffRequest('/api/session/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clear();
    router.replace('/login');
  }

  if (!hydrated || !platformAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading platform console…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-lg font-semibold tracking-tight">
              SuperClaim
            </Link>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Platform Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">{platformAdmin.email}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
