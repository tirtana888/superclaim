'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, Smartphone, Watch, Tv, CheckCircle2, ArrowRight, Lock, Users, Store, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="border-b border-slate-700/60 backdrop-blur bg-slate-900/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Shield className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
                SuperClaim
              </span>
              <span className="text-[10px] ml-2 text-teal-400 font-mono font-medium px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-800/60">
                v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800 bg-slate-800/60">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" /> Next-Gen Insurance Ecosystem for Electronics
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Seamless Protection for <span className="text-teal-400">Gadgets & Devices</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            A unified digital insurance platform connecting Backoffice Adjudication, Dealer Resellers, and Policyholders with built-in KYC, Xendit payment, and 7-stage claim milestone tracking.
          </p>

          {/* Stakeholder Portal Gateways */}
          <div className="pt-8">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-6">
              Select Stakeholder Portal to Explore
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Backoffice Admin */}
              <Link href="/admin/dashboard" className="group">
                <Card className="bg-slate-800/80 border-slate-700 hover:border-teal-500/50 hover:bg-slate-800 transition-all duration-200 h-full flex flex-col justify-between shadow-xl">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-2 group-hover:scale-105 transition-transform">
                      <Lock className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-white group-hover:text-teal-300 transition-colors flex items-center justify-between">
                      Backoffice Admin
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Product & plan configuration, KYC toggles, claim adjudication with 5% deductible ledger.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant="outline" className="border-teal-500/30 text-teal-300 text-[10px]">
                      Access /admin
                    </Badge>
                  </CardContent>
                </Card>
              </Link>

              {/* Dealer Portal */}
              <Link href="/dealer/dashboard" className="group">
                <Card className="bg-slate-800/80 border-slate-700 hover:border-teal-500/50 hover:bg-slate-800 transition-all duration-200 h-full flex flex-col justify-between shadow-xl">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-2 group-hover:scale-105 transition-transform">
                      <Store className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-white group-hover:text-teal-300 transition-colors flex items-center justify-between">
                      Dealer Portal
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Policy activation at point of sale, instant Xendit payment checkout & commission tracking.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant="outline" className="border-teal-500/30 text-teal-300 text-[10px]">
                      Access /dealer
                    </Badge>
                  </CardContent>
                </Card>
              </Link>

              {/* User Portal */}
              <Link href="/portal/dashboard" className="group">
                <Card className="bg-slate-800/80 border-slate-700 hover:border-teal-500/50 hover:bg-slate-800 transition-all duration-200 h-full flex flex-col justify-between shadow-xl">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-2 group-hover:scale-105 transition-transform">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-white group-hover:text-teal-300 transition-colors flex items-center justify-between">
                      User Portal
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      View active policies, submit claims with eKYC, and track progress on 7-stage milestone stepper.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant="outline" className="border-teal-500/30 text-teal-300 text-[10px]">
                      Access /portal
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-teal-400 p-1.5 rounded-lg bg-teal-500/10" />
            <span className="text-sm font-medium text-slate-300">Gadget & Mobile</span>
          </div>
          <div className="flex items-center gap-3">
            <Watch className="w-8 h-8 text-teal-400 p-1.5 rounded-lg bg-teal-500/10" />
            <span className="text-sm font-medium text-slate-300">Wearables & Audio</span>
          </div>
          <div className="flex items-center gap-3">
            <Tv className="w-8 h-8 text-teal-400 p-1.5 rounded-lg bg-teal-500/10" />
            <span className="text-sm font-medium text-slate-300">Smart Electronics</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-teal-400 p-1.5 rounded-lg bg-teal-500/10" />
            <span className="text-sm font-medium text-slate-300">5% Platform Deductible</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© 2025-2026 SuperClaim Platform v2.0 • Supabase + Xendit Architecture</p>
      </footer>
    </div>
  )
}
