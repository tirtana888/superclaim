'use client'

import React from 'react'
import Link from 'next/link'
import { 
  FileCheck2, 
  Store, 
  Percent, 
  ShieldCheck, 
  AlertCircle, 
  ArrowUpRight, 
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatDate } from '@/lib/utils'
import { mockClaims, mockDealers, mockPolicies } from '@/lib/mock-data'

export default function AdminDashboardPage() {
  // Key Stats
  const totalPolicies = 1420
  const activeDealersCount = mockDealers.length
  const pendingClaimsCount = mockClaims.filter(c => c.status === 'UNDER_REVIEW' || c.status === 'SUBMITTED').length
  const totalDeductibleCollected = 14250000 // 5% platform revenue

  return (
    <div className="p-8 space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            SuperClaim Backoffice Overview
          </h1>
          <p className="text-sm text-slate-400">
            Real-time policy issuance, claim adjudication pipeline, and 5% platform deductible metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/claims">
            <Button className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold gap-2">
              <FileCheck2 className="w-4 h-4" /> Review Pending Claims ({pendingClaimsCount})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Active Policies */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-medium text-slate-400">Active Policies</CardDescription>
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white mt-1">{totalPolicies.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-xs text-teal-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +14.2% from last month
            </p>
          </CardContent>
        </Card>

        {/* 5% Deductible Revenue */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-medium text-slate-400">5% Platform Deductible</CardDescription>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-amber-300 mt-1">{formatRupiah(totalDeductibleCollected)}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-xs text-slate-400">Auto-deducted from approved claims</p>
          </CardContent>
        </Card>

        {/* Active Authorized Dealers */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-medium text-slate-400">Authorized Dealers</CardDescription>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white mt-1">{activeDealersCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-xs text-slate-400">Across Jakarta & Jabodetabek</p>
          </CardContent>
        </Card>

        {/* Claims In Review */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-medium text-slate-400">Claims in Queue</CardDescription>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white mt-1">{pendingClaimsCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-xs text-rose-400 font-medium">Action required</p>
          </CardContent>
        </Card>
      </div>

      {/* Claims Adjudication Pipeline Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-800/80 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700/60 pb-4">
            <div>
              <CardTitle className="text-base font-semibold text-white">Recent Claims Pipeline</CardTitle>
              <CardDescription className="text-xs text-slate-400">Live adjudication queue with KYC & 5% deductible calculation</CardDescription>
            </div>
            <Link href="/admin/claims">
              <Button variant="ghost" size="sm" className="text-teal-400 hover:text-teal-300 hover:bg-slate-700/50 text-xs">
                View All <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700/60">
              {mockClaims.map((claim) => (
                <div key={claim.id} className="p-4 flex items-center justify-between hover:bg-slate-750/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-teal-300">{claim.claim_ref}</span>
                      <Badge variant={claim.status === 'PAYOUT_PROCESSING' ? 'success' : 'warning'} className="text-[10px]">
                        {claim.status}
                      </Badge>
                      {claim.kyc_status === 'PASSED' && (
                        <Badge variant="purple" className="text-[10px]">KYC PASSED</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1">{claim.description}</p>
                    <p className="text-[11px] text-slate-500">Incident: {formatDate(claim.incident_date)} • Amount: {formatRupiah(claim.claimed_amount)}</p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    {claim.approved_amount ? (
                      <div className="text-xs">
                        <span className="text-slate-400 block text-[10px]">Net Payout (After 5% Deductible):</span>
                        <span className="font-semibold text-emerald-400">{formatRupiah(claim.net_payout || 0)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-400 font-medium">Awaiting Review</span>
                    )}
                    <Link href="/admin/claims">
                      <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-slate-300 hover:bg-slate-700">
                        Adjudicate
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dealer Network Quick Summary */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader className="border-b border-slate-700/60 pb-4">
            <CardTitle className="text-base font-semibold text-white">Top Active Dealers</CardTitle>
            <CardDescription className="text-xs text-slate-400">Authorized partners issuing policies</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {mockDealers.map((dealer) => (
              <div key={dealer.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{dealer.business_name}</p>
                  <p className="text-xs text-slate-400">Commission: {dealer.commission_rate}% ({dealer.commission_schedule})</p>
                </div>
                <Badge variant="success" className="text-[10px]">Active</Badge>
              </div>
            ))}
            <Link href="/admin/dealers" className="block pt-2">
              <Button variant="outline" className="w-full text-xs border-slate-700 text-slate-300 hover:bg-slate-700">
                Manage Dealer Network
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
