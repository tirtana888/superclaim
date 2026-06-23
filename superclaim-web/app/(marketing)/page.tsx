import Link from 'next/link';

export default function MarketingPage() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-medium text-primary">AI warranty claims</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Approve claims faster. Catch fraud earlier.
          </h1>
          <p className="text-lg text-muted-foreground">
            SuperClaim helps electronics brands automate warranty decisions with vision AI, deterministic policy rules, and fraud detection.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Start free trial
            </Link>
            <Link href="/pricing" className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium hover:bg-muted">
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-semibold">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              ['1. Connect', 'Register devices and configure warranty policies without code.'],
              ['2. Submit', 'Customers submit claims via your API or hosted claim page.'],
              ['3. Decide', 'AI analyzes photos; policy engine returns approve, reject, or review.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-medium">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            ['Reduce fraud', 'Duplicate detection, EXIF checks, and ML fraud scoring.'],
            ['Ship faster', 'Most claims decided in seconds, not days.'],
            ['Easy integration', 'REST API + hosted claim page per brand.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-border p-6">
              <h3 className="font-medium">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-semibold">Ready to automate warranty claims?</h2>
          <p className="mt-3 text-muted-foreground">Start with a free trial workspace today.</p>
          <Link href="/signup" className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Create workspace
          </Link>
        </div>
      </section>
    </>
  );
}
