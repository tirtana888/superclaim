'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  FileKey2,
  LayoutDashboard,
  Package,
  ScrollText,
  Shield,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { canManageSettings } from '@/lib/auth';
import { useAuthStore } from '@/store/auth-store';

const NAV = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard, roles: ['owner', 'admin', 'reviewer'] },
  { href: '/claims', label: 'Claims', icon: ScrollText, roles: ['owner', 'admin', 'reviewer'] },
  { href: '/policies', label: 'Policies', icon: Shield, roles: ['owner', 'admin'] },
  { href: '/devices', label: 'Devices', icon: Package, roles: ['owner', 'admin'] },
  { href: '/api-keys', label: 'API keys', icon: FileKey2, roles: ['owner', 'admin'] },
  { href: '/team', label: 'Team', icon: Users, roles: ['owner', 'admin'] },
  { href: '/usage', label: 'Usage', icon: BarChart3, roles: ['owner', 'admin'] },
];

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);

  return (
    <aside className="flex h-full w-64 flex-col bg-card px-3 py-6">
      <div className="mb-8 flex items-center gap-2.5 px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
          S
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">SuperClaim</p>
          <p className="text-[11px] text-muted-foreground">Brand dashboard</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.filter((item) => item.roles.includes(role ?? '')).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {!canManageSettings(role) && (
        <div className="mt-4 rounded-lg bg-muted/60 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">Reviewer access — read and review claims only.</p>
        </div>
      )}
    </aside>
  );
}
