'use client';

import { useQuery } from '@tanstack/react-query';

import { bffRequest } from '@/lib/api';
import type { DeviceListResponse } from '@/lib/types';

export default function DevicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => bffRequest<DeviceListResponse>('/api/control/devices'),
  });
  const rows = data?.devices ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
        <p className="mt-1 text-sm text-muted-foreground">Registered devices for warranty lookup</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {['Serial', 'Category', 'Model', 'Purchased', 'Source'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
            {rows.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{d.serial_number}</td>
                <td className="px-4 py-3">{d.device_category}</td>
                <td className="px-4 py-3">{d.device_model ?? '—'}</td>
                <td className="px-4 py-3">{d.purchase_date ?? '—'}</td>
                <td className="px-4 py-3">{d.source}</td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No devices yet — import via API or add in a future session</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
