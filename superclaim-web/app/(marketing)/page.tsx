import Link from 'next/link';

export default function MarketingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="max-w-2xl space-y-6">
        <p className="text-sm font-medium text-primary">AI warranty claims</p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Approve claims faster. Catch fraud earlier.
        </h1>
        <p className="text-lg text-muted-foreground">
          SuperClaim helps electronics brands automate warranty decisions with vision AI, policy rules, and fraud detection.
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

      <section className="mt-24 grid gap-8 md:grid-cols-3">
        {[
          ['Analyze photos', 'Vision AI detects damage type and severity from customer uploads.'],
          ['Apply your rules', 'Deterministic policy engine — no black-box LLM decisions.'],
          ['Integrate quickly', 'REST API with API keys; hosted claim page for brands without dev teams.'],
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl border border-border p-6">
            <h3 className="font-medium">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
