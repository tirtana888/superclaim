'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardTopbar } from '@/components/dashboard/topbar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { bffRequest } from '@/lib/api';
import type { MeResponse } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, tenant, hydrated, setSession, setHydrated, clear } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const me = await bffRequest<MeResponse>('/api/session/me');
        if (cancelled) return;
        if (me.platform_admin && !me.user) {
          router.replace('/login');
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

  if (!hydrated || !user || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Loading workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <div className="hidden border-r border-border/60 md:block">
        <DashboardSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border/60 bg-card px-4 py-2 md:hidden">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>} />
            <SheetContent side="left" className="w-64 p-0">
              <DashboardSidebar onNavigate={() => {}} />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-semibold tracking-tight">{tenant.name}</span>
        </div>
        <DashboardTopbar />
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
