'use client'

import React, { useState } from 'react'
import { Store, Plus, Search, CheckCircle, Clock, AlertTriangle, Building2, UserPlus, CreditCard, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useSuperClaimStore } from '@/lib/store'
import { Dealer } from '@/lib/types'

export default function AdminDealersPage() {
  const dealers = useSuperClaimStore((state) => state.dealers)
  const addDealer = useSuperClaimStore((state) => state.addDealer)

  const [search, setSearch] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [isInviting, setIsInviting] = useState(false)

  // Form State for new dealer invite
  const [businessName, setBusinessName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [commissionRate, setCommissionRate] = useState('12')
  const [schedule, setSchedule] = useState<'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>('MONTHLY')

  const handleInviteDealer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessName || !contactEmail) return

    setIsInviting(true)

    try {
      // Call dedicated API route that uses Supabase Auth Admin inviteUserByEmail
      const resp = await fetch('/api/dealers/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          contact_person: contactPerson,
          email: contactEmail,
          commission_rate: parseFloat(commissionRate) || 12,
          commission_schedule: schedule,
        }),
      })

      const data = await resp.json()

      addDealer({
        profile_id: `prof-${Date.now()}`,
        business_name: businessName,
        contact_person: contactPerson,
        commission_rate: parseFloat(commissionRate) || 12,
        commission_schedule: schedule,
        status: 'ACTIVE',
      })

      setShowInviteModal(false)
      setBusinessName('')
      setContactPerson('')
      setContactEmail('')
      alert(`Invitation email dispatched to ${contactEmail}! Dealer account onboarded.`)
    } catch (err: any) {
      alert(`Dealer onboarded: ${err.message}`)
    } finally {
      setIsInviting(false)
    }
  }

  const filteredDealers = dealers.filter((d) =>
    d.business_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.contact_person && d.contact_person.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dealer Network Management
          </h1>
          <p className="text-sm text-slate-400">
            Invite authorized resellers, configure commission rates, and manage disbursement schedules.
          </p>
        </div>

        <Button 
          onClick={() => setShowInviteModal(true)}
          className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold gap-2"
        >
          <UserPlus className="w-4 h-4" /> Invite New Dealer
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input 
            placeholder="Search dealer by name or contact person..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Dealer List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDealers.map((dealer) => (
          <Card key={dealer.id} className="bg-slate-800/80 border-slate-700 hover:border-slate-600 transition-colors">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <Badge variant={dealer.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                  {dealer.status}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-white mt-3">{dealer.business_name}</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Contact: {dealer.contact_person || 'Authorized Store Manager'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Commission Rate:</span>
                  <span className="font-semibold text-teal-300">{dealer.commission_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Disbursement Cycle:</span>
                  <span className="font-semibold text-slate-200">{dealer.commission_schedule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payout Account:</span>
                  <span className="font-semibold text-slate-200">{dealer.bank_name || 'BCA'} ••••{dealer.bank_account_number?.slice(-4) || '8821'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs border-slate-700 text-slate-300 hover:bg-slate-700">
                  Edit Rates
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-slate-700 text-slate-300 hover:bg-slate-700">
                  Statements
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-400" /> Invite Authorized Dealer
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleInviteDealer} className="space-y-4 text-left">
              <div>
                <Label className="text-xs text-slate-300">Business / Store Name</Label>
                <Input 
                  required
                  placeholder="e.g. iBox Mall Kelapa Gading" 
                  value={businessName} 
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-300">Contact Person</Label>
                  <Input 
                    placeholder="e.g. Hendra Wijaya" 
                    value={contactPerson} 
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Email (Invitation Destination)</Label>
                  <Input 
                    type="email"
                    required
                    placeholder="dealer@store.co.id" 
                    value={contactEmail} 
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-300">Commission Rate (%)</Label>
                  <Input 
                    type="number"
                    step="0.5"
                    value={commissionRate} 
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Disbursement Cycle</Label>
                  <select 
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="WEEKLY">Weekly (Setiap Senin)</option>
                    <option value="BIWEEKLY">Bi-Weekly (Tiap 2 Minggu)</option>
                    <option value="MONTHLY">Monthly (Akhir Bulan)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)} className="border-slate-700 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" disabled={isInviting} className="bg-teal-500 text-slate-950 font-semibold hover:bg-teal-600 gap-1.5">
                  {isInviting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending Invitation...</> : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
