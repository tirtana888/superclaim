'use client'

import React from 'react'
import Link from 'next/link'
import { 
  ShieldCheck, 
  Smartphone, 
  Download, 
  PlusCircle, 
  Calendar, 
  AlertCircle, 
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatDate } from '@/lib/utils'
import { useSuperClaimStore } from '@/lib/store'

export default function UserDashboardPage() {
  const policies = useSuperClaimStore((state) => state.policies)
  const claims = useSuperClaimStore((state) => state.claims)

  const activePolicy = policies[0]
  const activeClaim = claims[0]

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome, {activePolicy?.customer_name || 'Policyholder'}
          </h1>
          <p className="text-sm text-slate-400">
            Manage your insured devices, download digital certificates, or file an insurance claim.
          </p>
        </div>

        <Link href="/portal/claims/new">
          <Button className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-2">
            <PlusCircle className="w-4 h-4" /> Submit New Claim
          </Button>
        </Link>
      </div>

      {/* Active Claim Progress Notification Banner (if any) */}
      {activeClaim && (
        <Card className="bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-900 border-teal-500/50 shadow-lg">
          <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" className="text-[10px]">CLAIM IN PROGRESS</Badge>
                  <span className="font-mono text-xs text-slate-300 font-semibold">{activeClaim.claim_ref}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Status: {activeClaim.status.replace('_', ' ')}
                </h3>
                <p className="text-xs text-slate-400">
                  Incident: {activeClaim.incident_type.replace('_', ' ').toUpperCase()} • Estimated SLA: 3–5 Business Days
                </p>
              </div>
            </div>

            <Link href={`/portal/claims/${activeClaim.id}`}>
              <Button className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5">
                View 7-Stage Milestone Tracker <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Policy Card */}
      {activePolicy ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-slate-800/90 border-slate-700">
            <CardHeader className="border-b border-slate-700/60 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-white">{activePolicy.device_brand} {activePolicy.device_model}</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Policy No: <span className="font-mono font-bold text-teal-300">{activePolicy.policy_number}</span>
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="success" className="text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> ACTIVE COVERAGE
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Device Brand:</span>
                  <span className="font-semibold text-white">{activePolicy.device_brand}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Serial Number / IMEI:</span>
                  <span className="font-mono font-semibold text-teal-300">{activePolicy.serial_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Device Purchase Price:</span>
                  <span className="font-semibold text-white">{formatRupiah(activePolicy.purchase_price)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Protection Plan:</span>
                  <span className="font-semibold text-teal-300">{activePolicy.plan?.name || 'Gold Total Guard'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Valid Start:</span>
                  <span className="font-semibold text-slate-200">{formatDate(activePolicy.start_date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Valid Until:</span>
                  <span className="font-semibold text-emerald-400">{formatDate(activePolicy.end_date)}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Covered Protection Types
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['Physical Damage (Layar Retak)', 'Water Damage (Kemunduran Cairan)', 'Theft / Loss (Kehilangan)', 'Electrical Short Circuit'].map((cov) => (
                    <span key={cov} className="px-3 py-1 rounded-full bg-slate-900 text-xs border border-slate-700 text-slate-200">
                      ✓ {cov}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-700/60 pt-4">
              <Link href={`/portal/certificates/${activePolicy.id}`}>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-700 text-xs gap-1.5">
                  <Download className="w-4 h-4" /> View & Print Certificate (PDF)
                </Button>
              </Link>
              <Link href="/portal/claims/new">
                <Button variant="outline" className="border-teal-500/50 text-teal-300 hover:bg-teal-950/40 text-xs">
                  File a Claim for this Device
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Protection Summary Quick Card */}
          <Card className="bg-slate-800/90 border-slate-700 space-y-4 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-2">Claim Rules & Deductibles</h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800">
                  <span className="font-semibold text-amber-300 block mb-0.5">5% Platform Deductible</span>
                  A fixed 5% platform deductible is automatically deducted from approved claim payouts.
                </div>
                <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800">
                  <span className="font-semibold text-purple-300 block mb-0.5">eKYC Verification</span>
                  Gold tier claims require a 1-minute selfie & KTP liveness verification to prevent fraud.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/60">
              <p className="text-[11px] text-slate-400">Authorized Dealer: {activePolicy.dealer?.business_name || 'iBox Grand Indonesia'}</p>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="bg-slate-800 p-8 text-center text-slate-400">
          No active policies found. Purchase one from your nearest authorized dealer.
        </Card>
      )}
    </div>
  )
}
