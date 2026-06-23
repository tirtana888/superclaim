'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Building2, ListChecks, UserCheck, Users } from 'lucide-react';

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
            <StatCard label="Tenants" value={stats.data?.tenant_count ?? 0} icon={Building2} />
            <StatCard label="Active tenants" value={stats.data?.active_tenant_count ?? 0} icon={UserCheck} accent="positive" />
            <StatCard label="Users" value={stats.data?.user_count ?? 0} icon={Users} />
            <StatCard label="Claims" value={stats.data?.claim_count ?? 0} icon={ListChecks} />
          </>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Tenants</h2>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Name', 'Slug', 'Plan', 'Users', 'Claims', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-5 py-3.5 font-medium">{t.name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{t.slug ?? '—'}</td>
                  <td className="px-5 py-3.5">{t.plan_tier}</td>
                  <td className="px-5 py-3.5">{t.user_count}</td>
                  <td className="px-5 py-3.5">{t.claim_count}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={t.is_active ? 'default' : 'secondary'}>
                      {t.is_active ? 'active' : 'disabled'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
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
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
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
