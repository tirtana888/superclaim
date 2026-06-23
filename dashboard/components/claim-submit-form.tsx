'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';

const DEVICE_CATEGORIES = [
  'smartphone',
  'tablet',
  'laptop',
  'smartwatch',
  'earbuds',
];

function generateClaimId() {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `CLM-TRIAL-${n}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ClaimSubmitForm() {
  const router = useRouter();
  const [claimId, setClaimId] = useState(generateClaimId);
  const [deviceCategory, setDeviceCategory] = useState('smartphone');
  const [serial, setSerial] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [claimDate, setClaimDate] = useState(new Date().toISOString().slice(0, 10));
  const [damageDescription, setDamageDescription] = useState('');
  const [userId, setUserId] = useState('trial-user-001');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineOnline, setEngineOnline] = useState<boolean | null>(null);
  const [engineUrl, setEngineUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/submit')
      .then((r) => r.json())
      .then((d) => {
        setEngineOnline(d.online);
        setEngineUrl(d.url ?? null);
      })
      .catch(() => setEngineOnline(false));
  }, []);

  const isLocalEngine =
    !engineUrl ||
    engineUrl.includes('localhost') ||
    engineUrl.includes('127.0.0.1');

  function handleFileChange(selected: File | null) {
    setFile(selected);
    if (preview) URL.revokeObjectURL(preview);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Upload foto kerusakan dulu');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const content_base64 = await fileToBase64(file);
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: claimId,
          device_category: deviceCategory,
          serial_number_input: serial || undefined,
          purchase_date: purchaseDate || undefined,
          claim_date: claimDate || undefined,
          damage_description: damageDescription || undefined,
          policy_id: 'POL-001',
          images: [
            {
              filename: file.name,
              content_base64,
              content_type: file.type || 'image/jpeg',
            },
          ],
          metadata: { user_id: userId, source: 'trial-ui' },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Submit gagal');

      router.push(`/claims/${claimId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit gagal');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {engineOnline === false && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 space-y-2">
          {isLocalEngine ? (
            <>
              <p className="font-medium">
                Engine API offline — <code className="text-amber-50">SUPERCLAIM_API_URL</code> belum
                dikonfigurasi.
              </p>
              <p>
                Di <strong>Railway → service dashboard → Variables</strong>, tambahkan:
              </p>
              <pre className="overflow-x-auto rounded bg-black/30 p-2 text-xs text-amber-50">
{`SUPERCLAIM_API_URL=https://superclaim-production.up.railway.app
SUPERCLAIM_API_KEY=sc_globalbeli_dev_2026
SUPERCLAIM_TENANT_ID=e1b52fb2-2fb0-4c4d-b9b3-e46e4edec9d6`}
              </pre>
              <p className="text-xs text-amber-200/80">
                Ganti URL dengan domain API Railway Anda (tanpa slash di akhir), lalu{' '}
                <strong>Redeploy</strong> dashboard.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">
                Engine API tidak merespons:{' '}
                <code className="text-amber-50">{engineUrl}</code>
              </p>
              <p className="text-xs text-amber-200/80">
                Cek service <strong>superclaim-api</strong> di Railway masih online, lalu buka{' '}
                <a
                  href={`${engineUrl}/health`}
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {engineUrl}/health
                </a>
              </p>
            </>
          )}
        </div>
      )}

      {engineOnline && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Engine API online — siap terima klaim trial.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Claim ID</span>
          <input
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={claimId}
            onChange={(e) => setClaimId(e.target.value)}
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Device category</span>
          <select
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={deviceCategory}
            onChange={(e) => setDeviceCategory(e.target.value)}
          >
            {DEVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Serial number</span>
          <input
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="SN123456789"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">User ID (metadata)</span>
          <input
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Purchase date</span>
          <input
            type="date"
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Claim date</span>
          <input
            type="date"
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={claimDate}
            onChange={(e) => setClaimDate(e.target.value)}
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm text-[hsl(var(--muted-foreground))]">Damage description</span>
        <textarea
          className="min-h-[80px] w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          value={damageDescription}
          onChange={(e) => setDamageDescription(e.target.value)}
          placeholder="Layar retak parah di bagian kanan bawah..."
        />
      </label>

      <div className="card">
        <p className="mb-3 text-sm font-medium">Foto kerusakan *</p>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[hsl(var(--border))] px-6 py-10 transition hover:border-emerald-500/50 hover:bg-[hsl(var(--muted))]/20">
          <Upload className="mb-2 h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Klik untuk upload JPG / PNG
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </label>
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="mt-4 max-h-64 rounded-lg border border-[hsl(var(--border))] object-contain"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading || engineOnline === false}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Mengirim ke AI...' : 'Submit klaim trial'}
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-lg border border-[hsl(var(--border))] px-5 py-2.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-white"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
