import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-grid-mesh flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            S
          </span>
          <span className="text-base font-semibold tracking-tight">SuperClaim</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-20">{children}</main>
    </div>
  );
}
