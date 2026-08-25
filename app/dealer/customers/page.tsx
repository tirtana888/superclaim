'use client'

import React from 'react'
import Link from 'next/link'
import { Users, ShieldCheck, Download, Search, Smartphone, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatRupiah, formatDate } from '@/lib/utils'
import { useSuperClaimStore } from '@/lib/store'

export default function DealerCustomersPage() {
  const policies = useSuperClaimStore((state) => state.policies)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Customer & Policy Portfolio
        </h1>
        <p className="text-sm text-slate-400">
          List of customers who purchased SuperClaim protection policies at your dealer store.
        </p>
      </div>

      <Card className="bg-slate-800/80 border-slate-700">
        <CardHeader className="border-b border-slate-700/60 pb-4">
          <CardTitle className="text-base font-semibold text-white">Active Customer Policies</CardTitle>
          <CardDescription className="text-xs text-slate-400">All issued certificates stored on Supabase Storage</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3">Policy Number</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Device / IMEI</th>
                <th className="px-6 py-3">Active Period</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {policies.map((pol) => (
                <tr key={pol.id} className="hover:bg-slate-750/30">
                  <td className="px-6 py-4 font-mono font-bold text-teal-300">{pol.policy_number}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">{pol.customer_name}</p>
                    <p className="text-[11px] text-slate-400">{pol.customer_phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-200">{pol.device_brand} {pol.device_model}</p>
                    <p className="font-mono text-[10px] text-slate-500">SN: {pol.serial_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    {formatDate(pol.start_date)} - {formatDate(pol.end_date)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="success" className="text-[10px]">ACTIVE</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/portal/certificates/${pol.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700 text-slate-300 hover:bg-slate-700 gap-1">
                        <FileText className="w-3 h-3 text-teal-400" /> Certificate
                      </Button>
                    </Link>
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
