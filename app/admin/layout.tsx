'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Shield, 
  LayoutDashboard, 
  Store, 
  Package, 
  FileCheck2, 
  BarChart3, 
  LogOut, 
  Home, 
  Lock,
  Percent,
  ShieldCheck
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/dealers', label: 'Dealer Network', icon: Store },
  { href: '/admin/products', label: 'Products & Plans', icon: Package },
  { href: '/admin/kyc', label: 'eKYC Rules & Audit', icon: ShieldCheck },
  { href: '/admin/claims', label: 'Claim Adjudication', icon: FileCheck2 },
  { href: '/admin/reports', label: 'Financial & Deductible', icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base text-white tracking-tight">SuperClaim</span>
                <span className="text-[10px] block text-teal-400 font-mono">BACKOFFICE</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] border-teal-500/30 text-teal-300">ADMIN</Badge>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 font-semibold shadow-md shadow-teal-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer / Switch Portal */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <Home className="w-4 h-4" /> Portal Switcher
          </Link>
          <div className="px-3 py-2 bg-slate-900 rounded-lg border border-slate-800">
            <p className="text-xs font-medium text-slate-300">SuperClaim Admin</p>
            <p className="text-[10px] text-slate-500 truncate">admin@superclaim.id</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-slate-900">
        {children}
      </main>
    </div>
  )
}
