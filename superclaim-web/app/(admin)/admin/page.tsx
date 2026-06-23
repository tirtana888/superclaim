'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { bffRequest } from '@/lib/api';
import type { PlatformStats, TenantAdmin } from '@/lib/types';

export default function AdminOverviewPage() {
  const qc = useQueryClient();

  const stats = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => bffRequest<PlatformStats>('/api/control/admin/stats'),
  });

  const tenants = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: () => bffRequest<{ tenants: TenantAdmin[] }>('/api/control/admin/tenants'),
  });

  const toggleActive = useMutation({
    mutationFn: (t: TenantAdmin) =>
      bffRequest<TenantAdmin>(`/api/control/admin/tenants/${t.id}`, {
        method: 'PATCH',
        body: { is_active: !t.is_active },
      }),
    onSuccess: () => {
      toast.success('Tenant updated');
      void qc.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  });

  const rows = tenants.data?.tenants ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage every brand workspace on SuperClaim</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Tenants" value={stats.data?.tenant_count ?? 0} />
            <StatCard label="Active tenants" value={stats.data?.active_tenant_count ?? 0} />
            <StatCard label="Users" value={stats.data?.user_count ?? 0} />
            <StatCard label="Claims" value={stats.data?.claim_count ?? 0} />
          </>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Tenants</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {['Name', 'Slug', 'Plan', 'Users', 'Claims', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.slug ?? '—'}</td>
                  <td className="px-4 py-3">{t.plan_tier}</td>
                  <td className="px-4 py-3">{t.user_count}</td>
                  <td className="px-4 py-3">{t.claim_count}</td>
                  <td className="px-4 py-3">
                    <Badge variant={t.is_active ? 'default' : 'secondary'}>
                      {t.is_active ? 'active' : 'disabled'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={toggleActive.isPending}
                      onClick={() => toggleActive.mutate(t)}
                    >
                      {t.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              ))}
              {!tenants.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No tenants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
