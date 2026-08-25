'use client'

import React from 'react'
import { DollarSign, CheckCircle2, Clock, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatDate } from '@/lib/utils'
import { mockCommissions } from '@/lib/mock-data'

export default function DealerCommissionsPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Commission & Disbursement Center
          </h1>
          <p className="text-sm text-slate-400">
            Track earned sales commissions, payout schedules, and bank transfer statements.
          </p>
        </div>

        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5">
          <Download className="w-4 h-4" /> Download Statement
        </Button>
      </div>

      <Card className="bg-slate-800/80 border-slate-700">
        <CardHeader className="border-b border-slate-700/60 pb-4">
          <CardTitle className="text-base font-semibold text-white">Commission Transaction Ledger</CardTitle>
          <CardDescription className="text-xs text-slate-400">Real-time commission calculated per activated policy</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3">Transaction Date</th>
                <th className="px-6 py-3">Policy Ref</th>
                <th className="px-6 py-3">Commission Rate</th>
                <th className="px-6 py-3">Earned Amount</th>
                <th className="px-6 py-3">Batch Period</th>
                <th className="px-6 py-3">Disbursement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {mockCommissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-slate-750/30">
                  <td className="px-6 py-4">{formatDate(comm.created_at)}</td>
                  <td className="px-6 py-4 font-mono font-bold text-teal-300">SC-2025-008912</td>
                  <td className="px-6 py-4">{comm.rate}%</td>
                  <td className="px-6 py-4 font-bold text-teal-400">{formatRupiah(comm.amount)}</td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{comm.period_batch || 'MONTHLY-2025-02'}</td>
                  <td className="px-6 py-4">
                    <Badge variant={comm.status === 'DISBURSED' ? 'success' : 'warning'} className="text-[10px]">
                      {comm.status}
                    </Badge>
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
