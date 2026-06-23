import type { Metadata } from 'next';

import { AppNav } from '@/components/app-nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'SuperClaim Dashboard',
  description: 'AI-powered warranty claims processing',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <main className="min-h-screen px-4 py-8 md:px-8">
          <div className="mx-auto max-w-7xl">
            <AppNav />
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
