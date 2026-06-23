'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Brand = { name: string; slug: string };

export default function HostedClaimPage({ params }: { params: { brandSlug: string } }) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [claimId, setClaimId] = useState(`CLM-${Date.now()}`);
  const [serial, setSerial] = useState('');
  const [category, setCategory] = useState('smartphone');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [claimDate, setClaimDate] = useState(new Date().toISOString().slice(0, 10));
  const [damageType, setDamageType] = useState('screen');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/public/brands/${params.brandSlug}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      setBrand((await res.json()) as Brand);
      setLoading(false);
    })();
  }, [params.brandSlug]);

  async function fileToBase64(file: File): Promise<{ filename: string; content_base64: string; content_type: string }> {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return {
      filename: file.name,
      content_base64: btoa(binary),
      content_type: file.type || 'image/jpeg',
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) {
      toast.error('Upload at least one photo');
      return;
    }
    setSubmitting(true);
    try {
      const images = await Promise.all(files.map(fileToBase64));
      const res = await fetch(`/api/public/claim/${params.brandSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: claimId,
          device_category: category,
          serial_number_input: serial,
          purchase_date: purchaseDate,
          claim_date: claimDate,
          damage_description: `${damageType}: ${description}`,
          images,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail?.message ?? 'Submit failed');
      setSuccess(data.claim_id ?? claimId);
      toast.success('Claim submitted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!brand) return <div className="flex min-h-screen items-center justify-center text-sm text-destructive">Brand not found</div>;
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-border p-8 text-center">
          <h1 className="text-xl font-semibold">Claim submitted</h1>
          <p className="mt-2 text-sm text-muted-foreground">Reference: {success}</p>
          <p className="mt-4 text-xs text-muted-foreground">We will review your warranty claim shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4 py-12">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 shadow-sm">
        <p className="text-center text-sm text-muted-foreground">{brand.name}</p>
        <h1 className="mt-1 text-center text-2xl font-semibold">Submit warranty claim</h1>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label>Serial number</Label>
            <Input value={serial} onChange={(e) => setSerial(e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Device category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Damage type</Label>
              <Input value={damageType} onChange={(e) => setDamageType(e.target.value)} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Purchase date</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Claim date</Label>
              <Input type="date" value={claimDate} onChange={(e) => setClaimDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Describe the damage</Label>
            <textarea
              className="min-h-24 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Photos</Label>
            <Input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} required />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit claim'}
          </Button>
        </form>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Secured by SuperClaim</p>
    </div>
  );
}
