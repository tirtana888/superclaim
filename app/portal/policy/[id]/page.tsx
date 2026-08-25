'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ShieldCheck, Smartphone, Download, ArrowLeft, PlusCircle, CheckCircle2, Percent, Sparkles, Store } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatDate } from '@/lib/utils'
import { useSuperClaimStore } from '@/lib/store'

export default function PolicyDetailPage() {
  const params = useParams()
  const policyId = params.id as string
  const policies = useSuperClaimStore((state) => state.policies)

  const policy = policies.find((p) => p.id === policyId || p.policy_number === policyId) || policies[0]

  if (!policy) {
    return (
      <div className="p-12 text-center text-slate-400">
        Policy not found.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/portal/policies">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1 text-xs">
            <ArrowLeft className="w-4 h-4" /> Back to Policies
          </Button>
        </Link>
        <Link href={`/portal/certificates/${policy.id}`}>
          <Button className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download Digital Certificate
          </Button>
        </Link>
      </div>

      {/* Main Policy Card */}
      <Card className="bg-slate-800/90 border-slate-700">
        <CardHeader className="border-b border-slate-700/60 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">{policy.device_brand} {policy.device_model}</CardTitle>
                <CardDescription className="text-xs font-mono text-teal-300">
                  Policy Number: {policy.policy_number}
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" className="text-xs">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> ACTIVE COVERAGE
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block">Serial / IMEI:</span>
              <span className="font-mono text-white font-semibold text-sm">{policy.serial_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Purchase Value:</span>
              <span className="text-white font-semibold text-sm">{formatRupiah(policy.purchase_price)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Coverage Duration:</span>
              <span className="text-slate-200 font-medium">12 Months (1 Year)</span>
            </div>
            <div>
              <span className="text-slate-400 block">Expiry Date:</span>
              <span className="text-emerald-400 font-bold">{formatDate(policy.end_date)}</span>
            </div>
          </div>

          {/* Quota & Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block">Max Claims per Year:</span>
              <p className="text-lg font-bold text-white">2 Claims</p>
              <span className="text-[10px] text-slate-500">0 claims used this policy year</span>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block">Coverage Cap %:</span>
              <p className="text-lg font-bold text-teal-400">80% of Device Value</p>
              <span className="text-[10px] text-slate-500">Up to {formatRupiah(policy.purchase_price * 0.8)} per event</span>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block">Mandatory Deductible:</span>
              <p className="text-lg font-bold text-amber-400">5% Platform Deductible</p>
              <span className="text-[10px] text-slate-500">Non-waivable platform rule</span>
            </div>
          </div>

          {/* Scope of Perils */}
          <div>
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
              Included Covered Incidents
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-slate-200">
                ✓ <strong>Physical Damage:</strong> Cracked display, glass fractures, major drop impact.
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-slate-200">
                ✓ <strong>Liquid Ingress:</strong> Accidental immersion, water spill, rain damage.
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-slate-200">
                ✓ <strong>Theft / Loss:</strong> Device robbery / burglary with official police report.
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-slate-200">
                ✓ <strong>Short Circuit:</strong> Electrical component fault or surge damage.
              </div>
            </div>
          </div>

          {/* Issuing Dealer Info */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-teal-400" />
              <div>
                <span className="text-slate-400 block">Issuing Authorized Dealer:</span>
                <strong className="text-white">{policy.dealer?.business_name || 'iBox Grand Indonesia Store'}</strong>
              </div>
            </div>
            <span className="text-slate-400">Paid via {policy.payment_channel || 'QRIS'}</span>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t border-slate-700/60 pt-4">
          <Link href="/portal/claims/new">
            <Button className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5">
              <PlusCircle className="w-4 h-4" /> File Claim for This Device
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
