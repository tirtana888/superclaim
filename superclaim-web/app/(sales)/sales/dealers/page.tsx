'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Building2, KeyRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bffRequest } from '@/lib/api';
import type { DealerListResponse, DealerOnboardCreated } from '@/lib/types';

export default function SalesDealersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['sales', 'dealers'],
    queryFn: () => bffRequest<DealerListResponse>('/api/control/sales/dealers'),
  });

  const [open, setOpen] = useState(false);
  const [dealerName, setDealerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<DealerOnboardCreated | null>(null);

  async function onboardDealer() {
    setSaving(true);
    try {
      const res = await bffRequest<DealerOnboardCreated>('/api/control/sales/dealers', {
        method: 'POST',
        body: { dealer_name: dealerName.trim(), owner_email: ownerEmail.trim() },
      });
      setCreated(res);
      setOpen(false);
      setDealerName('');
      setOwnerEmail('');
      toast.success('Dealer onboarded');
      await qc.invalidateQueries({ queryKey: ['sales', 'dealers'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to onboard dealer');
    } finally {
      setSaving(false);
    }
  }

  const rows = data?.dealers ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dealers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Dealers you've onboarded onto SuperClaim</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>Onboard dealer</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Onboard new dealer</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="dealer-name">Company name</Label>
                <Input id="dealer-name" value={dealerName} onChange={(e) => setDealerName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-email">Owner email</Label>
                <Input id="owner-email" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
              </div>
              <Button
                onClick={() => void onboardDealer()}
                disabled={saving || !dealerName.trim() || !ownerEmail.trim()}
              >
                {saving ? 'Onboarding…' : 'Onboard dealer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {created && (
        <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/5 shadow-sm">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <KeyRound className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 space-y-2.5">
              <p className="font-medium text-foreground">
                {created.tenant_name} onboarded — share credentials with {created.owner_email}
              </p>
              <p className="break-all rounded-lg bg-background/60 p-3 font-mono text-xs text-foreground">
                {created.temporary_password}
              </p>
              <p className="text-xs text-muted-foreground">
                Onboarding bonus awarded: ${created.onboarding_bonus_awarded.toFixed(2)}
              </p>
              <Button size="sm" variant="outline" onClick={() => setCreated(null)}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {['Dealer', 'Status', 'Plan', 'Claims processed', 'Revenue (month)', 'Last claim'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Loading…</td></tr>}
            {rows.map((d) => (
              <tr key={d.id} className="transition-colors hover:bg-muted/30">
                <td className="px-5 py-3.5">
                  <Link href={`/sales/dealers/${d.id}`} className="font-medium text-primary hover:underline">
                    {d.name}
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={d.is_active ? 'default' : 'secondary'} className="capitalize">{d.status}</Badge>
                </td>
                <td className="px-5 py-3.5 capitalize">{d.plan_tier}</td>
                <td className="px-5 py-3.5">{d.claims_processed_total}</td>
                <td className="px-5 py-3.5">${d.revenue_current_period.toFixed(2)}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{d.last_claim_at?.slice(0, 10) ?? '—'}</td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState
                    icon={Building2}
                    title="No dealers yet"
                    description="Onboard your first dealer to start earning commission."
                    action={<Button size="sm" onClick={() => setOpen(true)}>Onboard dealer</Button>}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
