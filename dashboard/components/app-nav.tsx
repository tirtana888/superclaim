import Link from 'next/link';

export function AppNav() {
  return (
    <nav className="mb-8 flex items-center gap-4 border-b border-[hsl(var(--border))] pb-4">
      <Link href="/" className="text-sm font-medium text-emerald-400">
        SuperClaim.ai
      </Link>
      <Link
        href="/"
        className="text-sm text-[hsl(var(--muted-foreground))] hover:text-white"
      >
        Dashboard
      </Link>
      <Link
        href="/submit"
        className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-600/30"
      >
        + Trial Submit
      </Link>
    </nav>
  );
}
