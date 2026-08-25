'use client'

import React, { useState } from 'react'
import { Package, ShieldCheck, ShieldAlert, Plus, ToggleLeft, ToggleRight, Sparkles, Percent, Check } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRupiah } from '@/lib/utils'
import { mockCategories, mockProducts, mockPlans } from '@/lib/mock-data'
import { Plan } from '@/lib/types'

export default function AdminProductsPage() {
  const [plans, setPlans] = useState<Plan[]>(mockPlans)
  const [globalKyc, setGlobalKyc] = useState(false)

  const togglePlanKyc = (planId: string) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        const nextState = !p.kyc_required
        return { ...p, kyc_required: nextState }
      }
      return p
    }))
  }

  return (
    <div className="p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Insurance Products & KYC Settings
          </h1>
          <p className="text-sm text-slate-400">
            Configure product catalog, coverage rules, pricing tiers, and claim KYC verification toggles.
          </p>
        </div>

        {/* Global KYC Toggle Card */}
        <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 px-4 py-2.5 rounded-xl">
          <div>
            <span className="text-xs font-semibold text-white block">Global KYC Enforce</span>
            <span className="text-[10px] text-slate-400">Require selfie & KTP on all claims</span>
          </div>
          <button 
            onClick={() => setGlobalKyc(!globalKyc)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              globalKyc ? 'bg-teal-500 text-slate-950' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {globalKyc ? 'ENABLED' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Categories Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockCategories.map((cat) => (
          <Card key={cat.id} className="bg-slate-800/80 border-slate-700">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-teal-500/40 text-teal-300 text-[10px]">{cat.code}</Badge>
                <Badge variant="success" className="text-[9px]">Active</Badge>
              </div>
              <CardTitle className="text-base font-bold text-white mt-1">{cat.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-400">{cat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Tiers Table & KYC Control */}
      <Card className="bg-slate-800/80 border-slate-700">
        <CardHeader className="border-b border-slate-700/60 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-white">Active Product Plans & Tiers</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Manage per-plan parameters, coverage types, limits, and individual KYC requirements
              </CardDescription>
            </div>
            <Badge variant="info" className="text-xs">
              <Percent className="w-3 h-3 mr-1" /> Platform Deductible: Fixed 5%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3">Plan Name</th>
                  <th className="px-6 py-3">Premium Price</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Coverage Scope</th>
                  <th className="px-6 py-3">Dealer Comm.</th>
                  <th className="px-6 py-3 text-center">KYC on Claim</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-750/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {plan.name}
                      <span className="block text-[11px] font-normal text-slate-400">Max {plan.max_claims} claims / yr ({plan.max_claim_value_pct}% cap)</span>
                    </td>
                    <td className="px-6 py-4 text-teal-300 font-medium">
                      {formatRupiah(plan.price)}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {plan.duration_months} Months
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {plan.coverage_types.map(c => (
                          <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 capitalize">
                            {c.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono">
                      {plan.commission_rate}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => togglePlanKyc(plan.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          plan.kyc_required || globalKyc
                            ? 'bg-purple-900/60 text-purple-200 border border-purple-500/50'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {plan.kyc_required || globalKyc ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                            KYC REQUIRED
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                            OPTIONAL
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
