'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, MessageSquare, PhoneCall, HelpCircle, FileText, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react'
import { MilestoneTracker } from '@/components/user/milestone-tracker'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSuperClaimStore } from '@/lib/store'

export default function ClaimDetailPage() {
  const params = useParams()
  const claimId = params.id as string
  const claims = useSuperClaimStore((state) => state.claims)
  const [isUploadingDocs, setIsUploadingDocs] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // Match claim by ID or claim_ref or fallback to first
  const claim = claims.find((c) => c.id === claimId || c.claim_ref === claimId) || claims[0]

  if (!claim) {
    return (
      <div className="p-12 text-center text-slate-400">
        Claim not found.
      </div>
    )
  }

  const handleUploadAdditionalDocs = () => {
    setIsUploadingDocs(true)
    setTimeout(() => {
      setIsUploadingDocs(false)
      setUploadSuccess(true)
      alert('Additional proof photos uploaded! Claim status updated back to Under Review.')
    }, 1200)
  }

  return (
    <div className="space-y-8">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/portal/dashboard">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1.5 text-xs">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-teal-400" /> WhatsApp Support
          </Button>
        </div>
      </div>

      {/* 7-Stage Milestone Tracker Component */}
      <MilestoneTracker claim={claim} />

      {/* Additional Requested Docs Upload Box (shown if DOCS_REQUESTED) */}
      {(claim.status === 'DOCS_REQUESTED' || claim.milestones?.some(m => m.stage === 4)) && (
        <Card className="bg-amber-950/30 border-amber-500/50 shadow-xl">
          <CardHeader className="pb-3 border-b border-amber-800/40">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertCircle className="w-5 h-5" />
              <CardTitle className="text-base font-bold">Action Required: Additional Evidence Requested</CardTitle>
            </div>
            <CardDescription className="text-xs text-amber-200/80">
              Backoffice claims specialist has requested clearer photo proof or official report.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {uploadSuccess ? (
              <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/50 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Documents Received</h4>
                <p className="text-xs text-slate-300">Your additional photos have been appended to the claim record.</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-amber-700/60 rounded-xl p-6 text-center bg-slate-950/60 space-y-3">
                <UploadCloud className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs font-semibold text-white">Click or drag additional damage photo files here</p>
                <span className="text-[10px] text-slate-400 block">Accepted: JPG, PNG, PDF (Max 10MB per file)</span>
                <Button
                  onClick={handleUploadAdditionalDocs}
                  disabled={isUploadingDocs}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5"
                >
                  {isUploadingDocs ? 'Uploading to Supabase Storage...' : 'Upload Requested Evidence'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Incident Details & Resolution SLA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/90 border-slate-700">
          <CardHeader className="pb-3 border-b border-slate-700/60">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" /> Incident Chronology
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">Incident Location:</span>
              <p className="font-semibold text-white mt-0.5">{claim.incident_location}</p>
            </div>
            <div>
              <span className="text-slate-400 block">User Description:</span>
              <p className="text-slate-300 mt-0.5 leading-relaxed">{claim.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/90 border-slate-700">
          <CardHeader className="pb-3 border-b border-slate-700/60">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-400" /> What Happens Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs text-slate-300">
            <p>
              1. <strong>Backoffice Inspection:</strong> Our claims specialists review all uploaded damage evidence against the policy coverage terms.
            </p>
            <p>
              2. <strong>Decision & Deductible:</strong> Upon approval, the 5% platform deductible is calculated and the remaining payout is immediately queued for bank disbursement.
            </p>
            <p>
              3. <strong>SLA Commitment:</strong> Standard claim adjudication is completed within 3 to 5 business days.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
