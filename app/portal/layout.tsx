'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Shield, 
  ShieldCheck, 
  PlusCircle, 
  Clock, 
  User, 
  Home, 
  FileText,
  Bell,
  Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function UserPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/portal/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight">SuperClaim</span>
                <span className="text-[10px] ml-2 text-teal-400 font-mono px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-800/60">
                  USER PORTAL
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
            <Link
              href="/portal/dashboard"
              className={`px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm ${
                pathname === '/portal/dashboard' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/portal/policies"
              className={`px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm ${
                pathname.startsWith('/portal/policies') || pathname.startsWith('/portal/policy') ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              My Policies
            </Link>
            <Link
              href="/portal/claims/new"
              className={`px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm ${
                pathname.startsWith('/portal/claims') ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Submit Claim
            </Link>
            <Link
              href="/portal/notifications"
              className={`p-2 rounded-lg transition-colors text-xs relative ${
                pathname === '/portal/notifications' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-slate-950" />
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white px-2 py-1 flex items-center gap-1 ml-1"
            >
              <Home className="w-3.5 h-3.5" /> Switch
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© 2025 SuperClaim Platform • Insured Gadgets & Electronics Protection</p>
      </footer>
    </div>
  )
}
