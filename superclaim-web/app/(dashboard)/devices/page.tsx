'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PackageOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsIndicator, TabsList, TabsTab } from '@/components/ui/tabs';
import { bffRequest } from '@/lib/api';
import type { DeviceListResponse } from '@/lib/types';

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function DevicesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [serial, setSerial] = useState('');
  const [category, setCategory] = useState('smartphone');
  const [csv, setCsv] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => bffRequest<DeviceListResponse>('/api/control/devices'),
  });

  const sourceTabs = useMemo(() => {
    const sources = Array.from(new Set((data?.devices ?? []).map((d) => d.source).filter(Boolean)));
    return ['all', ...sources];
  }, [data]);

  const rows = useMemo(() => {
    let all = data?.devices ?? [];
    if (sourceFilter !== 'all') all = all.filter((d) => d.source === sourceFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter((d) => d.serial_number.toLowerCase().includes(q));
    }
    return all;
  }, [data, search, sourceFilter]);

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        {sourceTabs.length > 1 ? (
          <Tabs value={sourceFilter} onValueChange={(v) => setSourceFilter(String(v))}>
            <TabsList>
              {sourceTabs.map((s) => (
                <TabsTab key={s} value={s}>
                  {s === 'all' ? 'All' : titleCase(s)}
                </TabsTab>
              ))}
              <TabsIndicator />
            </TabsList>
          </Tabs>
        ) : (
          <span />
        )}
        <Input placeholder="Search by serial…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

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
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState
                    icon={PackageOpen}
                    title={search || sourceFilter !== 'all' ? 'No devices match your filters' : 'No devices yet'}
                    description={
                      search || sourceFilter !== 'all'
                        ? 'Try a different search term or source filter.'
                        : 'Register devices to enable warranty lookup during claim analysis.'
                    }
                    action={
                      search || sourceFilter !== 'all' ? (
                        <Button variant="outline" size="sm" onClick={() => { setSearch(''); setSourceFilter('all'); }}>
                          Clear filters
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => setOpen(true)}>Add device</Button>
                          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>Bulk import</Button>
                        </>
                      )
                    }
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
