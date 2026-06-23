import Link from 'next/link';
import { ArrowRight, Cable, ScanSearch, ShieldCheck, Sparkles, Timer, Zap } from 'lucide-react';

const STEPS = [
  {
    title: 'Connect',
    body: 'Register devices and configure warranty policies without code.',
    icon: Cable,
  },
  {
    title: 'Submit',
    body: 'Customers submit claims via your API or a hosted claim page.',
    icon: ScanSearch,
  },
  {
    title: 'Decide',
    body: 'AI analyzes photos; the policy engine returns approve, reject, or review.',
    icon: Zap,
  },
];

const FEATURES = [
  {
    title: 'Reduce fraud',
    body: 'Duplicate detection, EXIF forensics, and ML fraud scoring catch bad claims before they cost you.',
    icon: ShieldCheck,
  },
  {
    title: 'Ship faster',
    body: 'Most claims are decided in seconds, not days — with full audit trails for every rule fired.',
    icon: Timer,
  },
  {
    title: 'Easy integration',
    body: 'A clean REST API plus a hosted claim page per brand. Live in an afternoon.',
    icon: Sparkles,
  },
];

export default function MarketingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-grid-mesh">
        <div className="mx-auto max-w-5xl px-6 pt-24 pb-28 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-xs-soft">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            AI-powered warranty claims engine
          </div>
          <h1 className="text-balance mx-auto max-w-3xl text-5xl font-semibold tracking-tighter text-foreground md:text-6xl">
            Approve claims faster.
            <br />
            <span className="bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              Catch fraud earlier.
            </span>
          </h1>
          <p className="text-balance mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            SuperClaim helps electronics brands automate warranty decisions with vision AI,
            deterministic policy rules, and fraud detection — built for scale.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Start free trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-card px-8 text-sm font-semibold text-foreground shadow-xs-soft transition-colors hover:bg-muted"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">No credit card required · Cancel anytime</p>
        </div>

        <div className="mx-auto -mb-px max-w-4xl px-6">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-floating">
            <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/50 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
              <span className="ml-3 text-xs font-medium text-muted-foreground">app.superclaim.ai/overview</span>
            </div>
            <div className="grid grid-cols-1 gap-4 bg-gradient-to-b from-muted/30 to-card p-6 sm:grid-cols-4">
              {[
                ['Open claims', '128'],
                ['Auto-approved', '94%'],
                ['Fraud caught', '$42,180'],
                ['Avg. decision', '1.8s'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border/60 bg-card p-4 shadow-xs-soft">
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">From claim to decision in three steps</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ title, body, icon: Icon }, i) => (
              <div
                key={title}
                className="group relative rounded-2xl border border-border/60 bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="absolute right-6 top-6 text-4xl font-semibold text-muted-foreground/10">
                  0{i + 1}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/30 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">Why teams choose SuperClaim</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Built for accuracy at scale</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {FEATURES.map(({ title, body, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-border/60 bg-card p-7 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <div className="bg-grid-mesh absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to automate warranty claims?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Start with a free trial workspace today — no engineering lift required.
          </p>
          <Link
            href="/signup"
            className="group mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Create workspace
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </>
  );
}
