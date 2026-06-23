'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bffRequest } from '@/lib/api';
import type { ApiCredentialCreated, ApiCredentialListResponse } from '@/lib/types';

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['credentials'],
    queryFn: () => bffRequest<ApiCredentialListResponse>('/api/control/credentials'),
  });
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [created, setCreated] = useState<ApiCredentialCreated | null>(null);
  const [saving, setSaving] = useState(false);

  async function createKey() {
    setSaving(true);
    try {
      const res = await bffRequest<ApiCredentialCreated>('/api/control/credentials', {
        method: 'POST',
        body: { label: label.trim() || null },
      });
      setCreated(res);
      setOpen(false);
      setLabel('');
      toast.success('API key created');
      await qc.invalidateQueries({ queryKey: ['credentials'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm('Revoke this API key?')) return;
    try {
      await bffRequest(`/api/control/credentials/${id}/revoke`, { method: 'POST' });
      toast.success('Key revoked');
      await qc.invalidateQueries({ queryKey: ['credentials'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function rotate(id: string) {
    if (!confirm('Rotate key? Old secret stops working immediately.')) return;
    try {
      const res = await bffRequest<ApiCredentialCreated>(`/api/control/credentials/${id}/rotate`, { method: 'POST' });
      setCreated(res);
      toast.success('Key rotated');
      await qc.invalidateQueries({ queryKey: ['credentials'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  const rows = data?.credentials ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use X-API-Key-Id and X-API-Secret headers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>Create key</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Create API key</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-label">Label</Label>
                <Input id="key-label" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <Button onClick={() => void createKey()} disabled={saving}>{saving ? 'Creating…' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {created && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <p className="font-medium">Copy secret now — shown once</p>
          <p className="mt-2 font-mono text-xs">Key: {created.key_id}</p>
          <p className="mt-1 break-all font-mono text-xs">Secret: {created.secret}</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => setCreated(null)}>Dismiss</Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {['Key ID', 'Label', 'Scopes', 'Status', 'Last used', ''].map((h) => (
                <th key={h || 'a'} className="px-4 py-2 text-left font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{c.key_id}</td>
                <td className="px-4 py-3">{c.label ?? '—'}</td>
                <td className="px-4 py-3">{c.scopes.join(', ')}</td>
                <td className="px-4 py-3">{c.status}</td>
                <td className="px-4 py-3">{c.last_used_at?.slice(0, 10) ?? '—'}</td>
                <td className="px-4 py-3 space-x-2">
                  {c.status === 'active' && (
                    <>
                      <button type="button" className="text-primary hover:underline" onClick={() => void rotate(c.id)}>Rotate</button>
                      <button type="button" className="text-destructive hover:underline" onClick={() => void revoke(c.id)}>Revoke</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No API keys yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
