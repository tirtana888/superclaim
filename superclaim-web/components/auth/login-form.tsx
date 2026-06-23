'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bffRequest } from '@/lib/api';
import type { MeResponse } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  tenant_slug: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', tenant_slug: '' },
  });

  async function onSubmit(values: FormValues) {
    try {
      await bffRequest('/api/session/login', {
        method: 'POST',
        body: {
          email: values.email,
          password: values.password,
          tenant_slug: values.tenant_slug?.trim() || undefined,
        },
      });
      const me = await bffRequest<MeResponse>('/api/session/me');
      setSession(me);
      router.push(searchParams.get('next') || '/overview');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Login failed');
    }
  }

  return (
    <Card className="w-full max-w-md border-border shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold">Sign in</CardTitle>
        <CardDescription>Access your brand workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant_slug">Workspace slug (if needed)</Label>
            <Input id="tenant_slug" placeholder="acme-corp" {...form.register('tenant_slug')} />
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No workspace?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
