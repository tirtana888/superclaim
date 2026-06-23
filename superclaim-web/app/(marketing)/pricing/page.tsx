import Link from 'next/link';
import { Check } from 'lucide-react';

const INCLUDED = [
  'First 100 claims / month during trial',
  'Vision AI damage detection',
  'OCR serial number extraction',
  'Deterministic policy engine',
  'ML fraud scoring',
  'Hosted claim page per brand',
];

export default function PricingPage() {
  return (
    <div className="bg-grid-mesh">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-sm font-semibold text-primary">Pricing</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tighter">Simple, usage-based pricing</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Pay for what you process. No setup fees, no long-term contracts.
        </p>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-lg">
          <div className="border-b border-border/60 bg-muted/30 p-8">
            <p className="text-sm font-semibold text-primary">Trial</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-5xl font-semibold tracking-tighter">$0</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">First 100 claims per month, on us.</p>
          </div>
          <div className="p-8">
            <ul className="space-y-3">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              Get started
            </Link>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Need higher volume or dedicated support?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Talk to us
          </Link>
        </p>
      </div>
    </div>
  );
}
