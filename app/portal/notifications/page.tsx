'use client'

import React from 'react'
import Link from 'next/link'
import { Bell, CheckCircle2, MessageSquare, Mail, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function UserNotificationsPage() {
  const notifications = [
    {
      id: '1',
      title: 'Claim Approved — Payout Queued',
      body: 'Your claim CLM-2025-00109 for iPhone 15 Pro has been approved for Rp 5.000.000 (Net Payout Rp 4.750.000 after 5% deductible).',
      date: 'Just now',
      unread: true,
      channel: 'WHATSAPP',
    },
    {
      id: '2',
      title: 'Policy Certificate Ready to Download',
      body: 'Policy SC-2025-008912 is now active for 12 months. Your digital PDF certificate has been stored.',
      date: '2 hours ago',
      unread: false,
      channel: 'EMAIL',
    },
    {
      id: '3',
      title: 'eKYC Identity Verified',
      date: '1 day ago',
      body: 'Your selfie & KTP verification has been verified successfully by our automated system.',
      unread: false,
      channel: 'IN_APP',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/portal/dashboard">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1 text-xs">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
        <span className="text-xs text-slate-400">All notifications are synced with WhatsApp & Email</span>
      </div>

      <Card className="bg-slate-800/90 border-slate-700">
        <CardHeader className="border-b border-slate-700/60 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-teal-400" />
              <CardTitle className="text-base font-bold text-white">Notifications Inbox</CardTitle>
            </div>
            <Badge variant="info" className="text-xs">3 Updates</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-slate-700/60">
          {notifications.map((n) => (
            <div key={n.id} className={`p-5 flex items-start gap-4 hover:bg-slate-750/30 ${n.unread ? 'bg-slate-850/40' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  <span className="text-[10px] text-slate-500">{n.date}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.body}</p>
                <div className="pt-1">
                  <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-700">
                    Channel: {n.channel}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
