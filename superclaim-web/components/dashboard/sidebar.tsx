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
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card px-3 py-6">
      <div className="mb-8 px-3">
        <p className="text-lg font-semibold tracking-tight">SuperClaim</p>
        <p className="text-xs text-muted-foreground">Brand dashboard</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.filter((item) => item.roles.includes(role ?? '')).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {!canManageSettings(role) && (
        <p className="mt-4 px-3 text-xs text-muted-foreground">Reviewer access — read and review claims only.</p>
      )}
    </aside>
  );
}
