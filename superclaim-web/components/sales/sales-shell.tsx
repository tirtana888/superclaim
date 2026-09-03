'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BarChart3, Building2, LayoutDashboard, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { bffRequest } from '@/lib/api';
import type { MeResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

const NAV = [
  { href: '/sales', label: 'Overview', icon: LayoutDashboard },
  { href: '/sales/dealers', label: 'Dealers', icon: Building2 },
  { href: '/sales/commission', label: 'Commission', icon: BarChart3 },
];

export function SalesShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { salesRep, hydrated, setSession, setHydrated, clear } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const me = await bffRequest<MeResponse>('/api/session/me');
        if (cancelled) return;
        if (!me.sales_rep) {
          router.replace(me.platform_admin ? '/admin' : '/overview');
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

  if (!hydrated || !salesRep) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Loading sales workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-card md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            S
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">SuperClaim</p>
            <p className="truncate text-[11px] text-muted-foreground">Sales workspace</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/60 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold uppercase text-foreground">
              {salesRep.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium tracking-tight">{salesRep.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{salesRep.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={logout}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 md:hidden">
          <span className="text-sm font-semibold tracking-tight">Sales workspace</span>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
          </Button>
        </header>
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
