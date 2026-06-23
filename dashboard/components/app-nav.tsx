'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function AppNav() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/session/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="mb-8 flex flex-wrap items-center gap-3 border-b border-[hsl(var(--border))] pb-4">
      <Link href="/" className="text-sm font-medium text-emerald-400">
        SuperClaim.ai
      </Link>
      <Link href="/" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-white">
        Claims
      </Link>
      <Link
        href="/submit"
        className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-600/30"
      >
        + Submit claim
      </Link>
      <span className="mx-1 text-[hsl(var(--border))]">|</span>
      <Link href="/settings/policies" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-white">
        Policies
      </Link>
      <Link href="/settings/devices" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-white">
        Devices
      </Link>
      <Link href="/settings/credentials" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-white">
        API keys
      </Link>
      <Link href="/settings/team" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-white">
        Team
      </Link>
      <Link href="/settings/usage" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-white">
        Usage
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        className="ml-auto text-sm text-[hsl(var(--muted-foreground))] hover:text-white"
      >
        Log out
      </button>
    </nav>
  );
}
