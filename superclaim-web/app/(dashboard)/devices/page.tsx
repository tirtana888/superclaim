'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bffRequest } from '@/lib/api';
import type { DeviceListResponse } from '@/lib/types';

export default function DevicesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [serial, setSerial] = useState('');
  const [category, setCategory] = useState('smartphone');
  const [csv, setCsv] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => bffRequest<DeviceListResponse>('/api/control/devices'),
  });

  const rows = useMemo(() => {
    const all = data?.devices ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((d) => d.serial_number.toLowerCase().includes(q));
  }, [data, search]);

  async function addDevice() {
    try {
      await bffRequest('/api/control/devices', {
        method: 'POST',
        body: { serial_number: serial, device_category: category },
      });
      toast.success('Device added');
      setOpen(false);
      setSerial('');
      await qc.invalidateQueries({ queryKey: ['devices'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function bulkImport() {
    const lines = csv.trim().split('\n').filter(Boolean);
    const devices = lines.map((line) => {
      const [sn, cat, model] = line.split(',').map((s) => s.trim());
      return {
        serial_number: sn,
        device_category: cat || 'smartphone',
        device_model: model || undefined,
        source: 'import' as const,
      };
    });
    try {
      const res = await bffRequest<{ total: number }>('/api/control/devices/bulk', {
        method: 'POST',
        body: { devices },
      });
      toast.success(`Imported ${res.total} devices`);
      setBulkOpen(false);
      setCsv('');
      await qc.invalidateQueries({ queryKey: ['devices'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed');
    }
  }

  async function removeDevice(id: string) {
    if (!confirm('Delete this device?')) return;
    try {
      await bffRequest(`/api/control/devices/${id}`, { method: 'DELETE' });
      toast.success('Device deleted');
      await qc.invalidateQueries({ queryKey: ['devices'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registered devices for warranty lookup</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogTrigger render={<Button variant="outline">Bulk import</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>CSV import</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">One device per line: serial,category,model</p>
              <textarea
                className="min-h-32 w-full rounded-lg border border-border bg-transparent p-3 text-sm"
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                placeholder="SN123,smartphone,iPhone 15&#10;SN456,laptop,MacBook Air"
              />
              <Button onClick={() => void bulkImport()}>Import</Button>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button>Add device</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Add device</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Serial number</Label>
                  <Input value={serial} onChange={(e) => setSerial(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <Button onClick={() => void addDevice()} disabled={!serial.trim()}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Input placeholder="Search by serial…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {['Serial', 'Category', 'Model', 'Purchased', 'Source', ''].map((h) => (
                <th key={h || 'a'} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Loading…</td></tr>}
            {rows.map((d) => (
              <tr key={d.id} className="transition-colors hover:bg-muted/30">
                <td className="px-5 py-3.5 font-medium">{d.serial_number}</td>
                <td className="px-5 py-3.5">{d.device_category}</td>
                <td className="px-5 py-3.5">{d.device_model ?? '—'}</td>
                <td className="px-5 py-3.5">{d.purchase_date ?? '—'}</td>
                <td className="px-5 py-3.5">{d.source}</td>
                <td className="px-5 py-3.5">
                  <button type="button" className="text-destructive hover:underline" onClick={() => void removeDevice(d.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No devices yet — add one or bulk import</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
