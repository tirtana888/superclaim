import { redirect } from 'next/navigation';

import { AdminNav } from '@/components/admin-nav';
import { controlFetch } from '@/lib/control-api';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const res = await controlFetch('/api/auth/me');
  if (!res.ok) {
    redirect('/login?next=/admin');
  }
  const data = (await res.json()) as { platform_admin?: { email: string } | null };
  if (!data.platform_admin) {
    redirect('/');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AdminNav email={data.platform_admin.email} />
      {children}
    </div>
  );
}
