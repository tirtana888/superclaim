import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          SuperClaim
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
