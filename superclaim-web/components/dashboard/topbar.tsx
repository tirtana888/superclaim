'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth-store';

function roleLabel(role: string | undefined): string {
  if (!role) return 'Member';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function DashboardTopbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);

  async function logout() {
    await fetch('/api/session/logout', { method: 'POST' });
    useAuthStore.getState().clear();
    router.push('/login');
    router.refresh();
  }

  const initials = (user?.email ?? 'U').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-tight">{tenant?.name ?? 'Workspace'}</p>
        <p className="truncate text-xs text-muted-foreground">{tenant?.slug ?? '—'}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="ghost" className="h-11 gap-2.5 rounded-full px-2 hover:bg-muted" aria-label="Account menu">
            <Avatar className="h-8 w-8 ring-1 ring-border">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[180px] flex-col items-start leading-tight sm:flex">
              <span className="truncate text-sm font-medium">{user?.email}</span>
              <span className="text-[11px] text-muted-foreground">{roleLabel(user?.role)}</span>
            </span>
          </Button>
        } />
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2.5 px-2 py-2">
            <Avatar className="h-9 w-9 ring-1 ring-border">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{user?.email}</p>
              <p className="truncate text-xs font-normal capitalize text-muted-foreground">
                {roleLabel(user?.role)} · {tenant?.name ?? 'Workspace'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => void logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
