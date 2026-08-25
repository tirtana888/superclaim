'use client'

import React, { useState } from 'react'
import { 
  FileCheck2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Eye, 
  Percent, 
  DollarSign, 
  ChevronRight,
  Filter,
  Check,
  Loader2
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { formatRupiah, formatDate } from '@/lib/utils'
import { useSuperClaimStore } from '@/lib/store'
import { Claim } from '@/lib/types'

export default function AdminClaimsPage() {
  const claims = useSuperClaimStore((state) => state.claims)
  const adjudicateClaimStore = useSuperClaimStore((state) => state.adjudicateClaim)
  const completeClaimStore = useSuperClaimStore((state) => state.completeClaim)

  const [selectedClaimId, setSelectedClaimId] = useState<string>(claims[0]?.id || '')
  const [showActionModal, setShowActionModal] = useState<'APPROVE' | 'REJECT' | 'DOCS' | null>(null)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  // Adjudication Form Inputs
  const [approvedAmountInput, setApprovedAmountInput] = useState('5000000')
  const [rejectionReasonInput, setRejectionReasonInput] = useState('')
  const [docsRequestNote, setDocsRequestNote] = useState('')

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || claims[0]

  // Deductible calculations in real-time
  const parsedApprovedAmount = parseFloat(approvedAmountInput) || 0
  const calculatedDeductible = Math.round(parsedApprovedAmount * 0.05)
  const calculatedNetPayout = parsedApprovedAmount - calculatedDeductible

  // Call POST /api/claims/[id]/approve
  const handleApprove = async () => {
    if (!selectedClaim || parsedApprovedAmount <= 0) return

    setIsSubmittingAction(true)
    try {
      const resp = await fetch(`/api/claims/${selectedClaim.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved_amount: parsedApprovedAmount,
          reviewer_id: 'SuperClaim Lead Adjudicator',
        }),
      })

      adjudicateClaimStore({
        claimId: selectedClaim.id,
        action: 'APPROVE',
        approvedAmount: parsedApprovedAmount,
        reviewerId: 'SuperClaim Lead Adjudicator',
      })

      setShowActionModal(null)
      alert(`Claim ${selectedClaim.claim_ref} APPROVED via API!\nGross: ${formatRupiah(parsedApprovedAmount)}\n5% Deductible: ${formatRupiah(calculatedDeductible)}\nNet Payout to User: ${formatRupiah(calculatedNetPayout)}`)
    } catch (err: any) {
      alert(`Error approving claim: ${err.message}`)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  // Call POST /api/claims/[id]/reject
  const handleReject = async () => {
    if (!selectedClaim || !rejectionReasonInput) return

    setIsSubmittingAction(true)
    try {
      await fetch(`/api/claims/${selectedClaim.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejection_reason: rejectionReasonInput,
          reviewer_id: 'SuperClaim Lead Adjudicator',
        }),
      })

      adjudicateClaimStore({
        claimId: selectedClaim.id,
        action: 'REJECT',
        rejectionReason: rejectionReasonInput,
        reviewerId: 'SuperClaim Lead Adjudicator',
      })

      setShowActionModal(null)
      alert(`Claim ${selectedClaim.claim_ref} REJECTED via API. Milestone updated to Stage 5.`)
    } catch (err: any) {
      alert(`Error rejecting claim: ${err.message}`)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  // Call POST /api/claims/[id]/request-docs
  const handleRequestDocs = async () => {
    if (!selectedClaim || !docsRequestNote) return

    setIsSubmittingAction(true)
    try {
      await fetch(`/api/claims/${selectedClaim.id}/request-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: docsRequestNote,
        }),
      })

      adjudicateClaimStore({
        claimId: selectedClaim.id,
        action: 'REQUEST_DOCS',
        docsNote: docsRequestNote,
        reviewerId: 'SuperClaim Lead Adjudicator',
      })

      setShowActionModal(null)
      alert(`Additional documents requested via API for ${selectedClaim.claim_ref}. Milestone set to Stage 4.`)
    } catch (err: any) {
      alert(`Error requesting docs: ${err.message}`)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  const handleCompletePayout = () => {
    if (!selectedClaim) return
    completeClaimStore(selectedClaim.id)
    alert(`Claim ${selectedClaim.claim_ref} marked as COMPLETED! Payout finalized.`)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Claim Adjudication & Payout Review
          </h1>
          <p className="text-sm text-slate-400">
            Review incident documents, verify Didit.me KYC liveness, and apply 5% platform deductible upon claim approval.
          </p>
        </div>
      </div>

      {/* Main 2-Column Split: Claim List & Adjudication Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-3">
          <p className="text-xs uppercase font-semibold text-slate-400">Claims Queue ({claims.length})</p>
          {claims.map((claim) => {
            const isSelected = selectedClaim?.id === claim.id
            return (
              <div
                key={claim.id}
                onClick={() => {
                  setSelectedClaimId(claim.id)
                  setApprovedAmountInput(claim.claimed_amount ? claim.claimed_amount.toString() : '5000000')
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-teal-500 shadow-md ring-1 ring-teal-500/50'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-teal-300">{claim.claim_ref}</span>
                  <Badge 
                    variant={
                      claim.status === 'APPROVED' || claim.status === 'PAYOUT_PROCESSING' || claim.status === 'COMPLETED' ? 'success' :
                      claim.status === 'REJECTED' ? 'destructive' :
                      claim.status === 'DOCS_REQUESTED' ? 'warning' : 'info'
                    }
                    className="text-[10px]"
                  >
                    {claim.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-1">{claim.description}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
                  <span>Incident: {formatDate(claim.incident_date)}</span>
                  <span className="font-semibold text-white">{formatRupiah(claim.claimed_amount)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Detail Workstation */}
        <div className="lg:col-span-7">
          {selectedClaim ? (
            <Card className="bg-slate-800/90 border-slate-700">
              <CardHeader className="border-b border-slate-700/80 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-teal-400" />
                      Claim Review: {selectedClaim.claim_ref}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-1">
                      Submitted on {formatDate(selectedClaim.created_at)} • Type: {selectedClaim.incident_type.replace('_', ' ').toUpperCase()}
                    </CardDescription>
                  </div>
                  <Badge variant={selectedClaim.kyc_status === 'PASSED' ? 'purple' : 'secondary'} className="text-xs">
                    Didit.me KYC: {selectedClaim.kyc_status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Incident Details */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Incident Location:</span>
                    <span className="font-medium text-white">{selectedClaim.incident_location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Claimed Amount:</span>
                    <span className="font-bold text-teal-300 text-sm">{formatRupiah(selectedClaim.claimed_amount)}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block">Incident Chronology:</span>
                    <p className="text-slate-200 mt-1">{selectedClaim.description}</p>
                  </div>
                </div>

                {/* Uploaded Evidence Documents Mock */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Evidence Documents (Supabase Storage: sc-claim-documents)
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-center hover:border-slate-700 transition-colors">
                      <Eye className="w-6 h-6 text-teal-400 mx-auto mb-1" />
                      <p className="text-[11px] font-medium text-slate-200 truncate">Damage_Screen.jpg</p>
                      <span className="text-[9px] text-slate-500">2.4 MB • PHOTO</span>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-center hover:border-slate-700 transition-colors">
                      <Eye className="w-6 h-6 text-teal-400 mx-auto mb-1" />
                      <p className="text-[11px] font-medium text-slate-200 truncate">Purchase_Invoice.pdf</p>
                      <span className="text-[9px] text-slate-500">840 KB • INVOICE</span>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-center hover:border-slate-700 transition-colors">
                      <ShieldCheck className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                      <p className="text-[11px] font-medium text-slate-200 truncate">Didit_Liveness_Check.jpg</p>
                      <span className="text-[9px] text-purple-400 font-semibold">VERIFIED (99.4%)</span>
                    </div>
                  </div>
                </div>

                {/* 5% Deductible Calculation Box */}
                {selectedClaim.approved_amount && (
                  <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Approved Claim Value:</span>
                      <span className="font-semibold text-white">{formatRupiah(selectedClaim.approved_amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-amber-300">
                      <span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> Mandatory 5% Platform Deductible:</span>
                      <span>- {formatRupiah(selectedClaim.deductible_amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-teal-300 pt-2 border-t border-teal-800/60">
                      <span>Net Payout to Policyholder:</span>
                      <span className="text-base">{formatRupiah(selectedClaim.net_payout || 0)}</span>
                    </div>
                  </div>
                )}

                {/* Adjudication Decision Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-700/80">
                  <Button 
                    onClick={() => setShowActionModal('APPROVE')}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Claim (5% Deductible)
                  </Button>
                  {selectedClaim.status === 'PAYOUT_PROCESSING' && (
                    <Button 
                      onClick={handleCompletePayout}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Finalize Payout (Complete)
                    </Button>
                  )}
                  <Button 
                    onClick={() => setShowActionModal('DOCS')}
                    variant="outline" 
                    className="border-slate-700 text-slate-300 hover:bg-slate-700 text-xs"
                  >
                    Request More Docs
                  </Button>
                  <Button 
                    onClick={() => setShowActionModal('REJECT')}
                    variant="outline" 
                    className="border-rose-800/60 text-rose-300 hover:bg-rose-950/50 text-xs"
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-800/40 rounded-xl border border-slate-800">
              Select a claim to review
            </div>
          )}
        </div>
      </div>

      {/* Action Modals */}
      {showActionModal === 'APPROVE' && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" /> Approve Claim Payout
            </h3>
            <p className="text-xs text-slate-400">
              Enter the assessed repair/replacement cost. The system will automatically calculate the 5% platform deductible.
            </p>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-slate-300">Approved Claim Amount (IDR)</Label>
                <Input 
                  type="number"
                  value={approvedAmountInput}
                  onChange={(e) => setApprovedAmountInput(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white font-mono text-base mt-1"
                />
              </div>

              {/* Deductible Live Preview */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Assessed Payout:</span>
                  <span className="text-white font-medium">{formatRupiah(parsedApprovedAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>5% Platform Deductible:</span>
                  <span>- {formatRupiah(calculatedDeductible)}</span>
                </div>
                <div className="flex justify-between text-teal-300 font-bold pt-1.5 border-t border-slate-800">
                  <span>Net Payout to User:</span>
                  <span>{formatRupiah(calculatedNetPayout)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowActionModal(null)} className="border-slate-700 text-slate-300">
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={isSubmittingAction} className="bg-teal-500 text-slate-950 font-bold hover:bg-teal-600 gap-1.5">
                {isSubmittingAction ? <><Loader2 className="w-4 h-4 animate-spin" /> Calling API...</> : 'Confirm & Dispatch Approval'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showActionModal === 'REJECT' && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" /> Reject Claim
            </h3>
            <p className="text-xs text-slate-400">
              Provide a mandatory explanation for rejection. This reason will be communicated clearly to the policyholder.
            </p>

            <div>
              <Label className="text-xs text-slate-300">Rejection Reason</Label>
              <textarea 
                rows={3}
                required
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Kerusakan akibat modifikasi tidak resmi / dokumen pembelian tidak valid."
                className="w-full mt-1 p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowActionModal(null)} className="border-slate-700 text-slate-300">
                Cancel
              </Button>
              <Button onClick={handleReject} disabled={isSubmittingAction} className="bg-rose-600 text-white font-bold hover:bg-rose-700 gap-1.5">
                {isSubmittingAction ? <><Loader2 className="w-4 h-4 animate-spin" /> Calling API...</> : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showActionModal === 'DOCS' && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" /> Request Additional Evidence
            </h3>
            <p className="text-xs text-slate-400">
              Specify what additional photos or documents the user needs to upload.
            </p>

            <div>
              <Label className="text-xs text-slate-300">Clarification Note</Label>
              <textarea 
                rows={3}
                value={docsRequestNote}
                onChange={(e) => setDocsRequestNote(e.target.value)}
                placeholder="e.g. Mohon upload foto nomor IMEI di pengaturan perangkat dan foto bagian belakang yang jelas."
                className="w-full mt-1 p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowActionModal(null)} className="border-slate-700 text-slate-300">
                Cancel
              </Button>
              <Button onClick={handleRequestDocs} disabled={isSubmittingAction} className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 gap-1.5">
                {isSubmittingAction ? <><Loader2 className="w-4 h-4 animate-spin" /> Calling API...</> : 'Send Request to User'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
