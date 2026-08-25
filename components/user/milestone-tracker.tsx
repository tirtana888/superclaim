'use client'

import React from 'react'
import { CheckCircle2, Clock, AlertCircle, FileText, ShieldCheck, DollarSign, Check, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Claim, ClaimMilestone } from '@/lib/types'

interface MilestoneTrackerProps {
  claim: Claim
}

export function MilestoneTracker({ claim }: MilestoneTrackerProps) {
  const isKycRequired = claim.kyc_status !== 'NOT_REQUIRED'
  const hasAdditionalDocs = claim.status === 'DOCS_REQUESTED' || (claim.milestones && claim.milestones.some(m => m.stage === 4))
  const isRejected = claim.status === 'REJECTED'

  // Define raw stages
  const rawStages = [
    {
      id: 1,
      title: 'Submitted',
      titleId: 'Klaim Diterima',
      desc: 'Claim received & logged in system',
      icon: FileText,
      condition: true,
    },
    {
      id: 2,
      title: 'KYC Verification',
      titleId: 'Verifikasi KYC',
      desc: 'Identity verification with KTP & Selfie',
      icon: ShieldCheck,
      condition: isKycRequired,
    },
    {
      id: 3,
      title: 'Under Review',
      titleId: 'Sedang Ditinjau',
      desc: 'Backoffice is inspecting damage evidence',
      icon: Clock,
      condition: true,
    },
    {
      id: 4,
      title: 'Additional Docs',
      titleId: 'Dokumen Tambahan',
      desc: 'Clarification or extra proof needed',
      icon: AlertCircle,
      condition: hasAdditionalDocs,
    },
    {
      id: 5,
      title: isRejected ? 'Claim Rejected' : 'Decision Made',
      titleId: isRejected ? 'Klaim Ditolak' : 'Keputusan Diambil',
      desc: isRejected ? (claim.rejection_reason || 'Claim did not meet criteria') : 'Claim approved by SuperClaim team',
      icon: isRejected ? AlertCircle : CheckCircle2,
      condition: true,
    },
    {
      id: 6,
      title: 'Payout Processing',
      titleId: 'Pembayaran Diproses',
      desc: 'Bank disbursement underway',
      icon: DollarSign,
      condition: !isRejected,
    },
    {
      id: 7,
      title: 'Completed',
      titleId: 'Selesai',
      desc: 'Payout transferred & claim closed',
      icon: Check,
      condition: true,
    },
  ]

  const activeStages = rawStages.filter(s => s.condition)

  // Determine current active index based on claim status
  const getStageIndex = () => {
    switch (claim.status) {
      case 'SUBMITTED':
        return 0
      case 'KYC_PENDING':
        return isKycRequired ? 1 : 0
      case 'UNDER_REVIEW':
        return isKycRequired ? 2 : 1
      case 'DOCS_REQUESTED':
        return activeStages.findIndex(s => s.id === 4)
      case 'APPROVED':
        return activeStages.findIndex(s => s.id === 5)
      case 'REJECTED':
        return activeStages.findIndex(s => s.id === 5)
      case 'PAYOUT_PROCESSING':
        return activeStages.findIndex(s => s.id === 6)
      case 'COMPLETED':
        return activeStages.length - 1
      default:
        return 0
    }
  }

  const currentIndex = Math.max(0, getStageIndex())

  return (
    <div className="space-y-6">
      {/* 7-Stage Visual Stepper */}
      <Card className="border-teal-100/60 shadow-md">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">
                Claim Progress Tracker
              </CardTitle>
              <CardDescription>
                Ref: <span className="font-mono font-bold text-teal-700">{claim.claim_ref}</span> • Incident: {claim.incident_type.replace('_', ' ').toUpperCase()}
              </CardDescription>
            </div>
            <Badge 
              variant={
                claim.status === 'COMPLETED' || claim.status === 'APPROVED' ? 'success' :
                claim.status === 'REJECTED' ? 'destructive' :
                claim.status === 'DOCS_REQUESTED' ? 'warning' : 'info'
              }
              className="text-xs px-3 py-1 font-semibold tracking-wide uppercase"
            >
              {claim.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Horizontal stepper for desktop / Vertical for mobile */}
          <div className="hidden lg:flex items-center justify-between relative">
            <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0">
              <div 
                className="h-full bg-teal-600 transition-all duration-500" 
                style={{ width: `${(currentIndex / (activeStages.length - 1)) * 100}%` }}
              />
            </div>

            {activeStages.map((stg, idx) => {
              const isDone = idx < currentIndex || claim.status === 'COMPLETED'
              const isCurrent = idx === currentIndex && claim.status !== 'COMPLETED'
              const IconComp = stg.icon

              return (
                <div key={stg.id} className="relative z-10 flex flex-col items-center text-center max-w-[130px]">
                  <div 
                    className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isDone 
                        ? 'bg-teal-600 border-teal-600 text-white shadow-sm' 
                        : isCurrent
                        ? isRejected 
                          ? 'bg-rose-600 border-rose-600 text-white ring-4 ring-rose-100'
                          : 'bg-teal-600 border-teal-600 text-white ring-4 ring-teal-100 animate-pulse'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <IconComp className="w-5 h-5" />}
                  </div>
                  <p className={`mt-2 text-xs font-semibold ${isCurrent ? 'text-teal-900' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                    {stg.titleId}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {stg.title}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Mobile vertical stepper */}
          <div className="lg:hidden space-y-4">
            {activeStages.map((stg, idx) => {
              const isDone = idx < currentIndex || claim.status === 'COMPLETED'
              const isCurrent = idx === currentIndex && claim.status !== 'COMPLETED'
              const IconComp = stg.icon

              return (
                <div key={stg.id} className="flex items-start gap-4">
                  <div 
                    className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${
                      isDone 
                        ? 'bg-teal-600 border-teal-600 text-white' 
                        : isCurrent
                        ? isRejected 
                          ? 'bg-rose-600 border-rose-600 text-white ring-4 ring-rose-100'
                          : 'bg-teal-600 border-teal-600 text-white ring-4 ring-teal-100'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : <IconComp className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${isCurrent ? 'text-teal-900' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                        {stg.titleId} <span className="text-xs font-normal text-slate-500">({stg.title})</span>
                      </p>
                      {isCurrent && (
                        <Badge variant="info" className="text-[10px]">In Progress</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{stg.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Claim Financial Breakdown & 5% Platform Deductible Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-slate-500">Submitted Claim</CardDescription>
            <CardTitle className="text-xl font-bold text-slate-800">
              {formatRupiah(claim.claimed_amount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-slate-500">Date: {formatDate(claim.incident_date)}</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-semibold text-amber-700">5% Platform Deductible</CardDescription>
              <Badge variant="warning" className="text-[10px]">Fixed 5%</Badge>
            </div>
            <CardTitle className="text-xl font-bold text-amber-800">
              {claim.approved_amount 
                ? formatRupiah(claim.deductible_amount || claim.approved_amount * 0.05) 
                : 'Calculated on approval'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-amber-600/90">Mandatory system-deductible applied to approved payout</p>
          </CardContent>
        </Card>

        <Card className="bg-teal-50/70 border-teal-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-teal-800">Estimated Net Payout</CardDescription>
            <CardTitle className="text-xl font-bold text-teal-900">
              {claim.approved_amount 
                ? formatRupiah(claim.net_payout || (claim.approved_amount - (claim.approved_amount * 0.05)))
                : 'Pending Adjudication'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-teal-700">Estimated resolution SLA: 3–5 business days</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
