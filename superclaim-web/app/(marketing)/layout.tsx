import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              S
            </span>
            <span className="text-base font-semibold tracking-tight">SuperClaim</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/pricing" className="text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              S
            </span>
            <span className="text-sm font-semibold tracking-tight">SuperClaim.ai</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SuperClaim.ai — AI-powered warranty claims
          </p>
        </div>
      </footer>
    </div>
  );
}
