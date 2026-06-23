'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  tenant_name: z.string().min(2, 'Company name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tenant_name: '', email: '', password: '' },
  });

  async function onSubmit(values: FormValues) {
    try {
      await bffRequest('/api/session/signup', { method: 'POST', body: values });
      const me = await bffRequest<MeResponse>('/api/session/me');
      setSession(me);
      router.push('/overview');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Signup failed');
    }
  }

  return (
    <Card className="w-full max-w-md border-border shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold">Create workspace</CardTitle>
        <CardDescription>Start processing warranty claims with AI</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant_name">Company name</Label>
            <Input id="tenant_name" {...form.register('tenant_name')} />
            {form.formState.errors.tenant_name && (
              <p className="text-sm text-destructive">{form.formState.errors.tenant_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register('password')} />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating…' : 'Create workspace'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
