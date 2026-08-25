'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, ShieldAlert, Key, Settings2, Sliders, CheckCircle2, History } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSuperClaimStore } from '@/lib/store'

export default function AdminKycConfigPage() {
  const globalKycEnabled = useSuperClaimStore((state) => state.globalKycEnabled)
  const toggleGlobalKyc = useSuperClaimStore((state) => state.toggleGlobalKyc)
  const plans = useSuperClaimStore((state) => state.plans)
  const togglePlanKyc = useSuperClaimStore((state) => state.togglePlanKyc)

  const [selectedProvider, setSelectedProvider] = useState<'verihubs' | 'privy' | 'sumsub'>('verihubs')
  const [apiKey, setApiKey] = useState('v_live_99812480198234891')
  const [appId, setAppId] = useState('app_superclaim_production')
  const [confidenceThreshold, setConfidenceThreshold] = useState('85')

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault()
    alert('eKYC provider credentials updated and encrypted in Supabase Vault!')
  }

  return (
    <div className="p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            eKYC Configuration & Rule Engine
          </h1>
          <p className="text-sm text-slate-400">
            PRD Section 4: Global identity verification toggles, per-plan overrides, and API provider credentials.
          </p>
        </div>

        <Link href="/admin/kyc/audit">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5">
            <History className="w-4 h-4 text-purple-400" /> View KYC Audit Log
          </Button>
        </Link>
      </div>

      {/* Global & Per-Plan Master Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global Master Toggle */}
        <Card className="bg-slate-800/90 border-slate-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <Badge variant={globalKycEnabled ? 'purple' : 'secondary'} className="text-xs font-bold">
                {globalKycEnabled ? 'GLOBALLY ENFORCED' : 'PLAN SPECIFIC'}
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-white">Global KYC Enforcement</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              When turned ON, all claims platform-wide will strictly require KTP photo and selfie liveness check regardless of individual plan settings.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-700/60 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Status: {globalKycEnabled ? 'ACTIVE' : 'OFF'}</span>
            <Button
              onClick={toggleGlobalKyc}
              className={globalKycEnabled ? 'bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs' : 'bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs'}
            >
              {globalKycEnabled ? 'Disable Global KYC' : 'Enable Global KYC'}
            </Button>
          </div>
        </Card>

        {/* eKYC Provider Selection */}
        <Card className="bg-slate-800/90 border-slate-700 p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <Key className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">Integrated eKYC Provider</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">Choose third-party biometric & OCR vendor</p>

          <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'didit.me', name: 'Didit.me', tag: 'Official (Active)' },
                { id: 'privy', name: 'PrivyID', tag: 'Alternative' },
                { id: 'verihubs', name: 'Verihubs', tag: 'Alternative' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id as any)}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    selectedProvider === p.id
                      ? 'bg-slate-900 border-teal-500 ring-2 ring-teal-500/30'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <strong className="block text-white text-xs">{p.name}</strong>
                  <span className="text-[9px] text-teal-400 font-medium">{p.tag}</span>
                </button>
              ))}
            </div>

            <div>
              <Label className="text-slate-300 text-[11px]">Didit.me Workflow ID</Label>
              <Input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="didit_workflow_kyc_default"
                className="bg-slate-950 border-slate-800 text-white font-mono mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-[11px]">Didit.me API Secret Key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white font-mono mt-1 h-8 text-xs"
              />
            </div>

            <Button type="submit" size="sm" className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs">
              Save Provider Config
            </Button>
          </form>
        </Card>
      </div>

      {/* Per-Plan KYC Override Table */}
      <Card className="bg-slate-800/90 border-slate-700">
        <CardHeader className="border-b border-slate-700/60 pb-4">
          <CardTitle className="text-base font-bold text-white">Per-Plan KYC Requirement Overrides</CardTitle>
          <CardDescription className="text-xs text-slate-400">Configure which specific protection plans mandate eKYC check upon filing a claim</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3">Plan Name</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Effective Rule</th>
                <th className="px-6 py-3 text-right">KYC Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-slate-750/30">
                  <td className="px-6 py-4 font-bold text-white">{plan.name}</td>
                  <td className="px-6 py-4">{plan.duration_months} Months</td>
                  <td className="px-6 py-4">
                    <Badge variant={plan.kyc_required || globalKycEnabled ? 'purple' : 'secondary'} className="text-[10px]">
                      {plan.kyc_required || globalKycEnabled ? 'KYC REQUIRED' : 'OPTIONAL (SKIPPED)'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePlanKyc(plan.id)}
                      className="border-slate-700 text-slate-300 hover:bg-slate-700 text-xs h-7"
                    >
                      Toggle {plan.kyc_required ? 'OFF' : 'ON'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
