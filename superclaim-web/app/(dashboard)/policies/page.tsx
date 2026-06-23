'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bffRequest } from '@/lib/api';
import type { PolicyListResponse } from '@/lib/types';

export default function PoliciesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: () => bffRequest<PolicyListResponse>('/api/control/policies'),
  });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function createPolicy() {
    setSaving(true);
    try {
      await bffRequest('/api/control/policies', {
        method: 'POST',
        body: {
          name,
          rules_json: {
            warranty_months: 12,
            covered_device_categories: ['smartphone', 'tablet', 'laptop'],
            covered_damage_types: ['screen', 'battery', 'water'],
            max_claims_per_serial: 2,
            cooling_period_days: 30,
          },
        },
      });
      toast.success('Policy created as draft');
      setOpen(false);
      setName('');
      await qc.invalidateQueries({ queryKey: ['policies'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function activate(id: string) {
    try {
      await bffRequest(`/api/control/policies/${id}/activate`, { method: 'POST' });
      toast.success('Policy activated');
      await qc.invalidateQueries({ queryKey: ['policies'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  const rows = data?.policies ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Policies</h1>
          <p className="mt-1 text-sm text-muted-foreground">Warranty rules for your brand</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>New policy</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create policy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="policy-name">Name</Label>
                <Input id="policy-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Standard warranty" />
              </div>
              <Button onClick={() => void createPolicy()} disabled={!name.trim() || saving}>
                {saving ? 'Creating…' : 'Create draft'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {['Name', 'ID', 'Version', 'Status', ''].map((h) => (
                <th key={h || 'a'} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-muted/30">
                <td className="px-5 py-3.5 font-medium">{p.name}</td>
                <td className="px-5 py-3.5">{p.external_policy_id}</td>
                <td className="px-5 py-3.5">v{p.version}</td>
                <td className="px-5 py-3.5"><Badge variant="secondary">{p.status}</Badge></td>
                <td className="px-5 py-3.5">
                  <Link href={`/policies/${p.id}`} className="mr-3 text-primary hover:underline">
                    Edit
                  </Link>
                  {p.status === 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => void activate(p.id)}>Activate</Button>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No policies yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
