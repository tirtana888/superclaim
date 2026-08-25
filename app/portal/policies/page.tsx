'use client'

import React from 'react'
import Link from 'next/link'
import { ShieldCheck, Smartphone, Download, ArrowRight, PlusCircle, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatDate } from '@/lib/utils'
import { useSuperClaimStore } from '@/lib/store'

export default function UserPoliciesPage() {
  const policies = useSuperClaimStore((state) => state.policies)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            My Insured Devices & Policies
          </h1>
          <p className="text-sm text-slate-400">
            View active coverage periods, download digital certificates, and monitor claim quotas.
          </p>
        </div>

        <Link href="/portal/claims/new">
          <Button className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5">
            <PlusCircle className="w-4 h-4" /> Submit Claim
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((policy) => (
          <Card key={policy.id} className="bg-slate-800/90 border-slate-700 flex flex-col justify-between">
            <CardHeader className="border-b border-slate-700/60 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white">{policy.device_brand} {policy.device_model}</CardTitle>
                    <CardDescription className="text-xs font-mono text-teal-300">
                      {policy.policy_number}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="success" className="text-[10px]">
                  ACTIVE
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Serial / IMEI:</span>
                  <span className="font-mono text-white font-medium">{policy.serial_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Insured Value:</span>
                  <span className="text-white font-medium">{formatRupiah(policy.purchase_price)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Coverage Start:</span>
                  <span className="text-slate-300">{formatDate(policy.start_date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Coverage Expiry:</span>
                  <span className="text-emerald-400 font-semibold">{formatDate(policy.end_date)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                <Link href={`/portal/certificates/${policy.id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs border-slate-700 text-slate-300 hover:bg-slate-700 gap-1">
                    <Download className="w-3.5 h-3.5 text-teal-400" /> Digital Certificate (PDF)
                  </Button>
                </Link>
                <Link href={`/portal/policy/${policy.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-teal-400 hover:text-teal-300 gap-1">
                    Policy Details <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
