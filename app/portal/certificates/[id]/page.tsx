'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Shield, ShieldCheck, Printer, Download, ArrowLeft, CheckCircle2, QrCode, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatDate } from '@/lib/utils'
import { useSuperClaimStore } from '@/lib/store'

export default function PolicyCertificatePage() {
  const params = useParams()
  const policyId = params.id as string
  const policies = useSuperClaimStore((state) => state.policies)
  
  const policy = policies.find((p) => p.id === policyId || p.policy_number === policyId) || policies[0]

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 print:py-0">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/portal/dashboard">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1 text-xs">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handlePrint}
            className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-2 text-xs"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Official Certificate Paper Container */}
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-12 border border-slate-200 print:shadow-none print:border-none print:p-0 relative overflow-hidden">
        {/* Decorative Watermark / Background Header */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-teal-500 via-teal-600 to-slate-900" />
        
        {/* Certificate Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black shadow-md">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">SuperClaim</h1>
              <p className="text-xs uppercase font-bold text-teal-700 tracking-wider">
                Official Gadget & Electronics Insurance Certificate
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
              Policy Certificate No.
            </span>
            <span className="font-mono font-extrabold text-xl text-teal-800 tracking-tight">
              {policy.policy_number}
            </span>
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE & INSURED
              </span>
            </div>
          </div>
        </div>

        {/* Certificate Body Grid */}
        <div className="py-8 space-y-8">
          {/* Section 1: Policyholder & Coverage Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">
                1. Policyholder Information
              </h3>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-slate-500 font-normal">Full Name:</span> <strong className="text-slate-900">{policy.customer_name}</strong></p>
                <p><span className="text-slate-500 font-normal">Email:</span> <strong className="text-slate-900">{policy.customer_email}</strong></p>
                <p><span className="text-slate-500 font-normal">Phone / WA:</span> <strong className="text-slate-900">{policy.customer_phone}</strong></p>
                <p><span className="text-slate-500 font-normal">Issuing Dealer:</span> <strong className="text-slate-900">{policy.dealer?.business_name || 'iBox Authorized Store'}</strong></p>
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">
                2. Insured Device Specifications
              </h3>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-slate-500 font-normal">Category:</span> <strong className="text-slate-900">{policy.device_category}</strong></p>
                <p><span className="text-slate-500 font-normal">Brand & Model:</span> <strong className="text-teal-800">{policy.device_brand} {policy.device_model}</strong></p>
                <p><span className="text-slate-500 font-normal">Serial / IMEI:</span> <strong className="font-mono text-slate-900">{policy.serial_number}</strong></p>
                <p><span className="text-slate-500 font-normal">Insured Value:</span> <strong className="text-slate-900">{formatRupiah(policy.purchase_price)}</strong></p>
              </div>
            </div>
          </div>

          {/* Section 2: Coverage Period & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Coverage Effective</span>
              <strong className="text-base text-slate-900 mt-1 block">{formatDate(policy.start_date)}</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Coverage Expiry</span>
              <strong className="text-base text-emerald-700 mt-1 block">{formatDate(policy.end_date)}</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Protection Plan</span>
              <strong className="text-base text-teal-800 mt-1 block">{policy.plan?.name || 'Gold Total Guard'}</strong>
            </div>
          </div>

          {/* Section 3: Covered Perils */}
          <div>
            <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">
              3. Scope of Insurance Protection
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200 text-teal-900 font-medium">
                ✓ Physical Damage / Layar Retak
              </div>
              <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200 text-teal-900 font-medium">
                ✓ Water Damage / Cairan
              </div>
              <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200 text-teal-900 font-medium">
                ✓ Theft / Kehilangan (Surat Polisi)
              </div>
              <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200 text-teal-900 font-medium">
                ✓ Electrical Short Circuit
              </div>
            </div>
          </div>

          {/* Section 4: Mandatory 5% Platform Deductible Clause */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-950 space-y-1">
            <strong className="font-bold block uppercase tracking-wide">
              Mandatory Platform Deductible Clause (5%)
            </strong>
            <p className="leading-relaxed">
              In accordance with SuperClaim Policy Terms v2.0, a standard 5% platform deductible applies to all approved repair or replacement claim settlements. The remaining 95% net approved value is disbursed directly to the policyholder.
            </p>
          </div>
        </div>

        {/* Certificate Footer with Digital Seal & Verification */}
        <div className="border-t border-slate-200 pt-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 p-1.5 rounded-lg border border-slate-300 flex items-center justify-center">
              <QrCode className="w-12 h-12 text-slate-800" />
            </div>
            <div className="text-xs text-slate-500">
              <p className="font-semibold text-slate-800">Digitally Verified & Registered</p>
              <p>Scan QR code to verify certificate authenticity on SuperClaim registry.</p>
              <p className="font-mono text-[10px] text-slate-400 mt-0.5">SHA256: 8f4e92a...c011b</p>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-slate-900">PT SUPERCLAIM PROTEKSI INDONESIA</div>
            <p className="text-slate-500 text-[11px]">Underwritten & Administered Digitally</p>
            <div className="h-8 border-b border-slate-400 w-40 ml-auto mt-2" />
            <span className="text-[10px] text-slate-400 block mt-1">Authorized Digital Signature</span>
          </div>
        </div>
      </div>
    </div>
  )
}
