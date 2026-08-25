'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Shield, Mail, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/accept-invite`,
      })
      if (error) {
        console.warn('Supabase resetPassword error:', error.message)
      }
      setIsSent(true)
    } catch (err) {
      setIsSent(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-slate-950 font-bold mx-auto shadow-xl shadow-teal-500/20">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-400">We will send you a secure password reset link to your email</p>
        </div>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            {isSent ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">Reset Link Dispatched</h3>
                <p className="text-xs text-slate-400">
                  If an account exists for <span className="text-teal-300 font-semibold">{email}</span>, you will receive instructions shortly.
                </p>
                <Link href="/login" className="block pt-2">
                  <Button variant="outline" className="w-full border-slate-700 text-slate-300 text-xs">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-300">Registered Email Address</Label>
                  <Input
                    type="email"
                    required
                    placeholder="name@store.co.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white mt-1"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-1.5 mt-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/login" className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
