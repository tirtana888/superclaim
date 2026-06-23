import { Suspense } from 'react';

import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
