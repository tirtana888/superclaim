'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bffRequest } from '@/lib/api';
import type { TeamInviteCreated, TeamListResponse } from '@/lib/types';

export default function TeamPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => bffRequest<TeamListResponse>('/api/control/team'),
  });
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'reviewer'>('reviewer');
  const [inviteResult, setInviteResult] = useState<TeamInviteCreated | null>(null);

  async function invite() {
    try {
      const res = await bffRequest<TeamInviteCreated>('/api/control/team/invite', {
        method: 'POST',
        body: { email, role },
      });
      setInviteResult(res);
      setOpen(false);
      setEmail('');
      toast.success('Invite sent');
      await qc.invalidateQueries({ queryKey: ['team'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invite failed');
    }
  }

  const rows = data?.members ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">People with access to this workspace</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>Invite member</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Invite team member</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'reviewer')}
                >
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button onClick={() => void invite()} disabled={!email.trim()}>Send invite</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {inviteResult && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <p className="font-medium">Temporary password (share securely with {inviteResult.email})</p>
          <p className="mt-2 font-mono">{inviteResult.temporary_password}</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => setInviteResult(null)}>Dismiss</Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {['Email', 'Role', 'Status'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
            {rows.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3">{m.role}</td>
                <td className="px-4 py-3">{m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
