'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  FileKey2,
  LayoutDashboard,
  type LucideIcon,
  Package,
  ScrollText,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { canManageSettings } from '@/lib/auth';
import { useAuthStore } from '@/store/auth-store';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { href: '/overview', label: 'Overview', icon: LayoutDashboard, roles: ['owner', 'admin', 'reviewer'] },
      { href: '/claims', label: 'Claims', icon: ScrollText, roles: ['owner', 'admin', 'reviewer'] },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { href: '/policies', label: 'Policies', icon: Shield, roles: ['owner', 'admin'] },
      { href: '/devices', label: 'Devices', icon: Package, roles: ['owner', 'admin'] },
      { href: '/api-keys', label: 'API keys', icon: FileKey2, roles: ['owner', 'admin'] },
    ],
  },
  {
    title: 'Organization',
    items: [
      { href: '/team', label: 'Team', icon: Users, roles: ['owner', 'admin'] },
      { href: '/usage', label: 'Usage', icon: BarChart3, roles: ['owner', 'admin'] },
    ],
  },
];

function roleLabel(role: string | undefined): string {
  if (!role) return 'Member';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const tenant = useAuthStore((s) => s.tenant);

  const sections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role ?? '')),
  })).filter((section) => section.items.length > 0);

  return (
    <aside className="flex h-full w-72 flex-col bg-card">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
          S
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">SuperClaim</p>
          <p className="truncate text-[11px] text-muted-foreground">Brand dashboard</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </p>
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                  )}
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground/80 group-hover:text-foreground',
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border/60 p-3">
        {!canManageSettings(role) && (
          <div className="mb-3 flex items-start gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-snug text-muted-foreground">
              Reviewer access — read and review claims only.
            </p>
          </div>
        )}
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold uppercase text-foreground">
            {(tenant?.name ?? 'W').slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium tracking-tight">{tenant?.name ?? 'Workspace'}</p>
            <p className="truncate text-[11px] capitalize text-muted-foreground">
              {tenant?.plan_tier ?? 'free'} · {roleLabel(role)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
