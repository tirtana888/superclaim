'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Settings2, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bffRequest } from '@/lib/api';
import type { CommissionSettings, SalesRep, SalesRepCreated } from '@/lib/types';

export default function AdminSalesPage() {
  const qc = useQueryClient();

  const settings = useQuery({
    queryKey: ['admin', 'commission-settings'],
    queryFn: () => bffRequest<CommissionSettings>('/api/control/admin/commission-settings'),
  });
  const reps = useQuery({
    queryKey: ['admin', 'sales-reps'],
    queryFn: () => bffRequest<{ sales_reps: SalesRep[] }>('/api/control/admin/sales-reps'),
  });

  const [bonus, setBonus] = useState('');
  const [rate, setRate] = useState('');
  const bonusValue = bonus || settings.data?.default_onboarding_bonus.toString() || '';
  const rateValue = rate || settings.data?.default_revenue_rate.toString() || '';

  const saveSettings = useMutation({
    mutationFn: () =>
      bffRequest<CommissionSettings>('/api/control/admin/commission-settings', {
        method: 'PATCH',
        body: {
          default_onboarding_bonus: Number(bonusValue),
          default_revenue_rate: Number(rateValue),
        },
      }),
    onSuccess: () => {
      toast.success('Commission settings updated');
      void qc.invalidateQueries({ queryKey: ['admin', 'commission-settings'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  });

  const toggleStatus = useMutation({
    mutationFn: (rep: SalesRep) =>
      bffRequest<SalesRep>(`/api/control/admin/sales-reps/${rep.id}`, {
        method: 'PATCH',
        body: { status: rep.status === 'active' ? 'disabled' : 'active' },
      }),
    onSuccess: () => {
      toast.success('Sales rep updated');
      void qc.invalidateQueries({ queryKey: ['admin', 'sales-reps'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<SalesRepCreated | null>(null);

  async function createSalesRep() {
    setCreating(true);
    try {
      const res = await bffRequest<SalesRepCreated>('/api/control/admin/sales-reps', {
        method: 'POST',
        body: { name: name.trim(), email: email.trim(), password },
      });
      setCreated(res);
      setOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      toast.success('Sales rep created');
      await qc.invalidateQueries({ queryKey: ['admin', 'sales-reps'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create sales rep');
    } finally {
      setCreating(false);
    }
  }

  const rows = reps.data?.sales_reps ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales &amp; commission</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage internal sales staff and their commission rates</p>
      </div>

      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Global commission settings</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default-bonus">Default onboarding bonus ($)</Label>
            <Input
              id="default-bonus"
              type="number"
              min={0}
              step="0.01"
              value={bonusValue}
              onChange={(e) => setBonus(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-rate">Default revenue commission rate (0-1)</Label>
            <Input
              id="default-rate"
              type="number"
              min={0}
              max={1}
              step="0.01"
              value={rateValue}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
        </div>
        <Button className="mt-4" size="sm" onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
          {saveSettings.isPending ? 'Saving…' : 'Save settings'}
        </Button>
      </section>

      {created && (
        <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/5 shadow-sm">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <KeyRound className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 space-y-2.5">
              <p className="font-medium text-foreground">
                Share these credentials securely with {created.email}
              </p>
              <p className="break-all rounded-lg bg-background/60 p-3 font-mono text-xs text-foreground">
                {created.email} / {created.temporary_password}
              </p>
              <Button size="sm" variant="outline" onClick={() => setCreated(null)}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Sales reps</h2>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button>Add sales rep</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Create sales rep account</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="rep-name">Name</Label>
                  <Input id="rep-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rep-email">Email</Label>
                  <Input id="rep-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rep-password">Password</Label>
                  <Input id="rep-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button
                  onClick={() => void createSalesRep()}
                  disabled={creating || !name.trim() || !email.trim() || password.length < 8}
                >
                  {creating ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Name', 'Email', 'Status', 'Bonus override', 'Rate override', ''].map((h) => (
                  <th key={h || 'action'} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {reps.isLoading && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Loading…</td></tr>}
              {rows.map((rep) => (
                <tr key={rep.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-5 py-3.5 font-medium">{rep.name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{rep.email}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={rep.status === 'active' ? 'default' : 'secondary'} className="capitalize">{rep.status}</Badge>
                  </td>
                  <td className="px-5 py-3.5">{rep.onboarding_bonus_override != null ? `$${rep.onboarding_bonus_override.toFixed(2)}` : '—'}</td>
                  <td className="px-5 py-3.5">{rep.revenue_rate_override != null ? `${(rep.revenue_rate_override * 100).toFixed(1)}%` : '—'}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={toggleStatus.isPending}
                      onClick={() => toggleStatus.mutate(rep)}
                    >
                      {rep.status === 'active' ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              ))}
              {!reps.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={Users}
                      title="No sales reps yet"
                      description="Create the first sales rep account so they can start onboarding dealers."
                      action={<Button size="sm" onClick={() => setOpen(true)}>Add sales rep</Button>}
                    />
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
