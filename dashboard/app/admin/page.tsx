'use client';

import { useEffect, useState } from 'react';

type Stats = {
  tenant_count: number;
  active_tenant_count: number;
  user_count: number;
  claim_count: number;
};

type Tenant = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  plan_tier: string;
  is_active: boolean;
  user_count: number;
  claim_count: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const [statsRes, tenantsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/tenants'),
      ]);
      if (!statsRes.ok || !tenantsRes.ok) {
        setError('Failed to load admin data');
        return;
      }
      const statsData = await statsRes.json();
      const tenantsData = await tenantsRes.json();
      setStats(statsData);
      setTenants(tenantsData.tenants ?? []);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Platform overview</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Manage all brands and workspaces on SuperClaim.ai
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Tenants', stats.tenant_count],
            ['Active tenants', stats.active_tenant_count],
            ['Users', stats.user_count],
            ['Claims', stats.claim_count],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
            >
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-medium">All tenants</h2>
        <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
          <table className="min-w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]/30">
              <tr>
                {['Name', 'Slug', 'Plan', 'Status', 'Users', 'Claims', 'Active'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t border-[hsl(var(--border))]">
                  <td className="px-4 py-2 font-medium">{t.name}</td>
                  <td className="px-4 py-2">{t.slug ?? '—'}</td>
                  <td className="px-4 py-2">{t.plan_tier}</td>
                  <td className="px-4 py-2">{t.status}</td>
                  <td className="px-4 py-2">{t.user_count}</td>
                  <td className="px-4 py-2">{t.claim_count}</td>
                  <td className="px-4 py-2">{t.is_active ? 'Yes' : 'No'}</td>
                </tr>
              ))}
              {tenants.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-[hsl(var(--muted-foreground))]">
                    No tenants yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
