'use client';

import { useQuery } from '@tanstack/react-query';

import { bffRequest } from '@/lib/api';
import type { TeamListResponse } from '@/lib/types';

export default function TeamPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => bffRequest<TeamListResponse>('/api/control/team'),
  });
  const rows = data?.members ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">People with access to this workspace</p>
      </div>
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
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No team members</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
