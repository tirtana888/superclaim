'use client'

import React from 'react'
import Link from 'next/link'
import { PlusCircle, ShieldCheck, DollarSign, Users, TrendingUp, ArrowRight, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatDate } from '@/lib/utils'
import { mockPolicies, mockCommissions } from '@/lib/mock-data'

export default function DealerDashboardPage() {
  const totalSold = 38
  const totalCommissionEarned = 4560000
  const pendingPayout = 1240000

  return (
    <div className="p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dealer Sales & Activation Hub
          </h1>
          <p className="text-sm text-slate-400">
            Issue policies at point of sale, trigger Xendit payment, and track accrued commissions.
          </p>
        </div>

        <Link href="/dealer/activate">
          <Button className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-2">
            <PlusCircle className="w-4 h-4" /> Activate Policy for Customer
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-medium text-slate-400">Total Policies Sold</CardDescription>
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white mt-1">{totalSold}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-xs text-teal-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +8 this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-medium text-slate-400">Total Commission Earned</CardDescription>
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-teal-300 mt-1">{formatRupiah(totalCommissionEarned)}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-xs text-slate-400">At standard 12% commission tier</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-medium text-slate-400">Next Disbursement</CardDescription>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white mt-1">{formatRupiah(pendingPayout)}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-xs text-blue-400">Scheduled: Monthly batch</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activations */}
      <Card className="bg-slate-800/80 border-slate-700">
        <CardHeader className="border-b border-slate-700/60 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-white">Recent Customer Activations</CardTitle>
            <CardDescription className="text-xs text-slate-400">Policies activated at your store location</CardDescription>
          </div>
          <Link href="/dealer/customers">
            <Button variant="ghost" size="sm" className="text-teal-400 text-xs hover:text-teal-300">
              View All Customers <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-700/60">
            {mockPolicies.map((policy) => (
              <div key={policy.id} className="p-4 flex items-center justify-between hover:bg-slate-750/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-300">{policy.policy_number}</span>
                    <Badge variant="success" className="text-[9px]">ACTIVE</Badge>
                  </div>
                  <p className="text-sm font-semibold text-white mt-1">{policy.customer_name} • {policy.device_model}</p>
                  <p className="text-xs text-slate-400">Payment: {policy.payment_channel} • Activated: {formatDate(policy.start_date)}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Your Commission:</span>
                  <span className="text-sm font-bold text-teal-300">{formatRupiah(78000)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
