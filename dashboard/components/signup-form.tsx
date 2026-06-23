'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignupForm() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/session/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_name: tenantName, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data?.detail?.message ?? 'Signup failed');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
      <h1 className="text-xl font-semibold">Create workspace</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <input
        className="w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2"
        placeholder="Brand / company name"
        value={tenantName}
        onChange={(e) => setTenantName(e.target.value)}
        required
      />
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
        placeholder="Password (min 8 chars)"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? 'Creating…' : 'Create workspace'}
      </button>
      <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
        Already have an account?{' '}
        <a href="/login" className="text-emerald-400 hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
