'use client'

import React, { useState } from 'react'
import { Bell, MessageSquare, Mail, X, CheckCircle2, ShieldCheck, Percent, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatDate } from '@/lib/utils'

export interface SimulatedNotification {
  id: string
  channel: 'WHATSAPP' | 'EMAIL'
  recipient: string
  title: string
  body: string
  timestamp: string
  read: boolean
}

export function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<SimulatedNotification[]>([
    {
      id: 'notif-1',
      channel: 'WHATSAPP',
      recipient: '081298765432 (Reza Pratama)',
      title: 'Klaim Disetujui (Ref: CLM-2025-00109)',
      body: 'Halo Reza, klaim iPhone 15 Pro Anda disetujui senilai Rp 5.000.000. Potongan 5% deductible: Rp 250.000. Dana bersih Rp 4.750.000 sedang diproses ke rekening Anda.',
      timestamp: 'Baru saja',
      read: false,
    },
    {
      id: 'notif-2',
      channel: 'EMAIL',
      recipient: 'reza.pratama@gmail.com',
      title: 'Polis SuperClaim Aktif & Sertifikat Digital (SC-2025-008912)',
      body: 'Selamat! Polis perlindungan iPhone 15 Pro Anda telah aktif. Klik di sini untuk mengunduh sertifikat resmi dan melihat cakupan kerusakan & kehilangan.',
      timestamp: '2 jam lalu',
      read: true,
    },
    {
      id: 'notif-3',
      channel: 'WHATSAPP',
      recipient: '08128918239 (iBox Grand Indonesia)',
      title: 'Komisi Penjualan Masuk (Rp 78.000)',
      body: 'Komisi 12% atas penjualan polis SC-2025-008912 telah tercatat di ledger Anda dan dijadwalkan cair pada batch akhir bulan.',
      timestamp: '1 hari lalu',
      read: true,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-teal-500/50 text-white p-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
      >
        <div className="relative">
          <Bell className="w-5 h-5 text-teal-400 group-hover:rotate-12 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-teal-500 text-slate-950 text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold pr-1 hidden sm:inline text-slate-200">
          WhatsApp & Email Live Feeds
        </span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Automated Notifications</h3>
                  <p className="text-[11px] text-slate-400">PRD Section 10: WhatsApp & Email Gateway</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification List */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 divide-y divide-slate-800/60">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl transition-colors ${
                    n.read ? 'bg-slate-900/60' : 'bg-slate-900 border border-teal-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {n.channel === 'WHATSAPP' ? (
                        <Badge variant="success" className="text-[9px] gap-1 px-1.5 py-0">
                          <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
                        </Badge>
                      ) : (
                        <Badge variant="info" className="text-[9px] gap-1 px-1.5 py-0">
                          <Mail className="w-2.5 h-2.5" /> Email
                        </Badge>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">{n.recipient}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                  </div>

                  <h4 className="text-xs font-bold text-white mb-1">{n.title}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950 p-2 rounded-lg border border-slate-800/80 font-sans">
                    {n.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/80 text-center">
              <p className="text-[10px] text-slate-400">
                Connected via SendGrid / Mailgun & Fonnte / Wablas WhatsApp API simulator
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
