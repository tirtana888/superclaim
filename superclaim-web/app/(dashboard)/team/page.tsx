'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';

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
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-xs-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
        <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/5 shadow-sm">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <KeyRound className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 space-y-2.5">
              <p className="font-medium text-foreground">
                Temporary password — share securely with {inviteResult.email}
              </p>
              <p className="break-all rounded-lg bg-background/60 p-3 font-mono text-xs text-foreground">
                {inviteResult.temporary_password}
              </p>
              <Button size="sm" variant="outline" onClick={() => setInviteResult(null)}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {['Email', 'Role', 'Status'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading && <tr><td colSpan={3} className="px-5 py-10 text-center text-muted-foreground">Loading…</td></tr>}
            {rows.map((m) => (
              <tr key={m.id} className="transition-colors hover:bg-muted/30">
                <td className="px-5 py-3.5">{m.email}</td>
                <td className="px-5 py-3.5">{m.role}</td>
                <td className="px-5 py-3.5">{m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
