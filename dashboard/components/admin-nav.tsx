'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function AdminNav({ email }: { email: string }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/session/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="mb-8 flex flex-wrap items-center gap-3 border-b border-[hsl(var(--border))] pb-4">
      <Link href="/admin" className="text-sm font-medium text-amber-400">
        SuperClaim Admin
      </Link>
      <span className="text-xs text-[hsl(var(--muted-foreground))]">Platform · {email}</span>
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
