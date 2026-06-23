import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-3 text-muted-foreground">Simple usage-based pricing for warranty claim volume.</p>
      <div className="mt-10 rounded-xl border border-border p-8">
        <p className="text-sm text-primary">Trial</p>
        <p className="mt-2 text-4xl font-semibold">$0</p>
        <p className="mt-2 text-sm text-muted-foreground">First 100 claims / month during trial</p>
        <Link href="/signup" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Get started
        </Link>
      </div>
    </div>
  );
}
