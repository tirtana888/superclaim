'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth-store';

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
    <header className="flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div>
        <p className="text-sm font-semibold tracking-tight">{tenant?.name ?? 'Workspace'}</p>
        <p className="text-xs text-muted-foreground">{tenant?.slug ?? '—'}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="ghost" className="h-10 gap-2 rounded-full px-2">
            <Avatar className="h-8 w-8 ring-1 ring-border">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{user?.email}</span>
          </Button>
        } />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => void logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
