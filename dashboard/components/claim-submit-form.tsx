'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';

const DEVICE_CATEGORIES = [
  'smartphone',
  'tablet',
  'laptop',
  'smartwatch',
  'earbuds',
];

const MAX_FILE_MB = 4;
const MAX_FILES = 5;

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

interface FilePreview {
  file: File;
  url: string;
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
  const [files, setFiles] = useState<FilePreview[]>([]);
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

  useEffect(() => {
    return () => {
      files.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [files]);

  const isLocalEngine =
    !engineUrl ||
    engineUrl.includes('localhost') ||
    engineUrl.includes('127.0.0.1');

  function handleFilesChange(selected: FileList | null) {
    if (!selected?.length) return;

    const next: FilePreview[] = [...files];
    for (const file of Array.from(selected)) {
      if (next.length >= MAX_FILES) {
        setError(`Maksimal ${MAX_FILES} foto per klaim`);
        break;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setError(`"${file.name}" terlalu besar — maksimal ${MAX_FILE_MB}MB per foto`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        setError(`"${file.name}" bukan file gambar`);
        continue;
      }
      next.push({ file, url: URL.createObjectURL(file) });
    }
    setFiles(next);
    setError(null);
  }

  function removeFile(index: number) {
    setFiles((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!serial.trim()) {
      setError('Serial number wajib diisi');
      return;
    }
    if (!purchaseDate) {
      setError('Purchase date wajib diisi');
      return;
    }
    if (!claimDate) {
      setError('Claim date wajib diisi');
      return;
    }
    if (!damageDescription.trim()) {
      setError('Damage description wajib diisi');
      return;
    }
    if (files.length === 0) {
      setError('Upload minimal 1 foto kerusakan');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const images = await Promise.all(
        files.map(async ({ file }) => ({
          filename: file.name,
          content_base64: await fileToBase64(file),
          content_type: file.type || 'image/jpeg',
        })),
      );

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: claimId,
          device_category: deviceCategory,
          serial_number_input: serial.trim(),
          purchase_date: purchaseDate,
          claim_date: claimDate,
          damage_description: damageDescription.trim(),
          policy_id: 'POL-001',
          images,
          metadata: { user_id: userId, source: 'trial-ui' },
        }),
      });

      const text = await res.text();
      let data: { error?: string } | null = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(text.slice(0, 300) || 'Submit gagal — respons tidak valid dari server');
      }
      if (!res.ok) throw new Error(data?.error ?? 'Submit gagal');

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
            </>
          ) : (
            <>
              <p className="font-medium">
                Engine API tidak merespons:{' '}
                <code className="text-amber-50">{engineUrl}</code>
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
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Claim ID *</span>
          <input
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={claimId}
            onChange={(e) => setClaimId(e.target.value)}
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Device category *</span>
          <select
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={deviceCategory}
            onChange={(e) => setDeviceCategory(e.target.value)}
            required
          >
            {DEVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Serial number *</span>
          <input
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="SN123456789"
            required
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
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Purchase date *</span>
          <input
            type="date"
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Claim date *</span>
          <input
            type="date"
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={claimDate}
            onChange={(e) => setClaimDate(e.target.value)}
            required
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm text-[hsl(var(--muted-foreground))]">Damage description *</span>
        <textarea
          className="min-h-[80px] w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          value={damageDescription}
          onChange={(e) => setDamageDescription(e.target.value)}
          placeholder="Layar retak parah di bagian kanan bawah..."
          required
        />
      </label>

      <div className="card">
        <p className="mb-1 text-sm font-medium">Foto kerusakan *</p>
        <p className="mb-3 text-xs text-[hsl(var(--muted-foreground))]">
          Upload 1–{MAX_FILES} foto (JPG/PNG/WebP, maks {MAX_FILE_MB}MB per foto). Foto pertama
          dipakai untuk analisis AI utama.
        </p>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[hsl(var(--border))] px-6 py-10 transition hover:border-emerald-500/50 hover:bg-[hsl(var(--muted))]/20">
          <Upload className="mb-2 h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Klik untuk pilih satu atau beberapa foto
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFilesChange(e.target.files);
              e.target.value = '';
            }}
          />
        </label>

        {files.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="relative rounded-lg border border-[hsl(var(--border))] p-2"
              >
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  aria-label={`Hapus ${item.file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <img
                  src={item.url}
                  alt={item.file.name}
                  className="h-36 w-full rounded object-cover"
                />
                <p className="mt-2 truncate text-xs text-[hsl(var(--muted-foreground))]">
                  {index === 0 ? 'Utama · ' : ''}
                  {item.file.name}
                </p>
              </div>
            ))}
          </div>
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
