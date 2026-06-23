'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/session/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        tenant_slug: tenantSlug.trim() || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data?.detail?.message ?? 'Login failed');
      return;
    }
    router.push(
      data.platform_admin
        ? '/admin'
        : searchParams.get('next') || '/',
    );
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
      <h1 className="text-xl font-semibold">Sign in</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <input
        className="w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <input
        className="w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2"
        placeholder="Workspace slug (if needed)"
        value={tenantSlug}
        onChange={(e) => setTenantSlug(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
        No account?{' '}
        <a href="/signup" className="text-emerald-400 hover:underline">
          Create workspace
        </a>
      </p>
    </form>
  );
}
