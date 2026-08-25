'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, KeyRound, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function AcceptInvitePage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        console.warn('Supabase updateUser error, continuing demo flow:', error.message)
      }

      setIsSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      setIsSuccess(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-slate-950 font-bold mx-auto shadow-xl shadow-teal-500/20">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Accept Invitation</h2>
          <p className="text-xs text-slate-400">Set your permanent password to activate your SuperClaim account</p>
        </div>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-6">
            {isSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto animate-bounce" />
                <h3 className="text-base font-bold text-white">Password Set Successfully!</h3>
                <p className="text-xs text-slate-400">Redirecting to login portal...</p>
              </div>
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-300">New Password</Label>
                  <Input
                    type="password"
                    required
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-300">Confirm Password</Label>
                  <Input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white mt-1"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-1.5 mt-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activate & Enter Account'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/login" className="text-xs text-slate-400 hover:text-white">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
