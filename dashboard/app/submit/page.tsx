import Link from 'next/link';

import { ClaimSubmitForm } from '@/components/claim-submit-form';

export default function SubmitPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm text-[hsl(var(--muted-foreground))] hover:text-emerald-400"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Trial Submit Klaim</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Simulasi flow Globalbeli — upload foto, kirim ke engine, lihat hasil AI (~30–60 detik).
        </p>
      </div>
      <div className="card">
        <ClaimSubmitForm />
      </div>
    </div>
  );
}
