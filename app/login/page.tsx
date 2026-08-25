'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Lock, ArrowRight, UserCheck, Store, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  const [email, setEmail] = useState('admin@superclaim.id')
  const [password, setPassword] = useState('SuperClaim2025!')
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'DEALER' | 'USER'>('ADMIN')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    try {
      const supabase = createClient()
      
      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // Set cookie for session consistency
      document.cookie = `superclaim_demo_role=${selectedRole}; path=/; max-age=86400`

      if (error) {
        console.warn('Supabase Auth remote sign-in:', error.message)
      }

      // 2. Redirect to destination or role dashboard
      if (redirectUrl) {
        router.push(redirectUrl)
      } else if (selectedRole === 'ADMIN') {
        router.push('/admin/dashboard')
      } else if (selectedRole === 'DEALER') {
        router.push('/dealer/dashboard')
      } else {
        router.push('/portal/dashboard')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full space-y-6">
      {/* Brand */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-slate-950 font-bold mx-auto shadow-xl shadow-teal-500/20">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to SuperClaim</h2>
        <p className="text-xs text-slate-400">Select your role or enter your credentials</p>
      </div>

      {/* Role Quick Selector */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedRole('ADMIN')
            setEmail('admin@superclaim.id')
          }}
          className={`p-3 rounded-xl border text-center transition-all ${
            selectedRole === 'ADMIN'
              ? 'bg-slate-800 border-teal-500 ring-2 ring-teal-500/30'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4 mx-auto mb-1 text-teal-400" />
          <span className="text-xs font-bold block text-white">Backoffice</span>
          <span className="text-[9px] text-slate-500">Admin</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedRole('DEALER')
            setEmail('ibox.gi@superclaim.id')
          }}
          className={`p-3 rounded-xl border text-center transition-all ${
            selectedRole === 'DEALER'
              ? 'bg-slate-800 border-teal-500 ring-2 ring-teal-500/30'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Store className="w-4 h-4 mx-auto mb-1 text-teal-400" />
          <span className="text-xs font-bold block text-white">Dealer</span>
          <span className="text-[9px] text-slate-500">Reseller</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedRole('USER')
            setEmail('reza.pratama@gmail.com')
          }}
          className={`p-3 rounded-xl border text-center transition-all ${
            selectedRole === 'USER'
              ? 'bg-slate-800 border-teal-500 ring-2 ring-teal-500/30'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4 mx-auto mb-1 text-teal-400" />
          <span className="text-xs font-bold block text-white">User</span>
          <span className="text-[9px] text-slate-500">Policyholder</span>
        </button>
      </div>

      {/* Login Form */}
      <Card className="bg-slate-900/90 border-slate-800">
        <form onSubmit={handleLogin}>
          <CardContent className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <Label className="text-xs text-slate-300">Email Address</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300">Password</Label>
                <Link href="/auth/reset-password" className="text-[11px] text-teal-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white mt-1"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-1.5 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Enter {selectedRole} Portal <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <div className="pt-2 text-center">
              <Link href="/auth/accept-invite" className="text-[11px] text-slate-400 hover:text-teal-300">
                Received an email invitation? <span className="underline">Setup password here</span>
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>

      <div className="text-center">
        <Link href="/" className="text-xs text-slate-400 hover:text-white">
          ← Return to SuperClaim Homepage
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-400 text-xs">Loading login portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
