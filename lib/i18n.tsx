'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'id' | 'en'

interface Translations {
  [key: string]: {
    id: string
    en: string
  }
}

export const translations: Translations = {
  // Navigation & Common
  dashboard: { id: 'Dashboard', en: 'Dashboard' },
  dealers: { id: 'Jaringan Dealer', en: 'Dealer Network' },
  products: { id: 'Produk & KYC', en: 'Products & KYC' },
  claims: { id: 'Adjudikasi Klaim', en: 'Claim Adjudication' },
  reports: { id: 'Laporan Keuangan', en: 'Financial Reports' },
  activate_policy: { id: 'Aktivasi Polis', en: 'Activate Policy' },
  my_customers: { id: 'Pelanggan Saya', en: 'My Customers' },
  commissions: { id: 'Pusat Komisi', en: 'Commission Center' },
  my_policies: { id: 'Polis Saya', en: 'My Policies' },
  submit_claim: { id: 'Ajukan Klaim', en: 'Submit Claim' },
  sign_in: { id: 'Masuk', en: 'Sign In' },
  switch_portal: { id: 'Pilih Portal', en: 'Portal Switcher' },

  // Milestone Stages
  stage_1: { id: 'Klaim Diterima', en: 'Submitted' },
  stage_2: { id: 'Verifikasi KYC', en: 'KYC Verification' },
  stage_3: { id: 'Sedang Ditinjau', en: 'Under Review' },
  stage_4: { id: 'Dokumen Tambahan', en: 'Additional Docs' },
  stage_5: { id: 'Keputusan Diambil', en: 'Decision Made' },
  stage_6: { id: 'Pembayaran Diproses', en: 'Payout Processing' },
  stage_7: { id: 'Selesai', en: 'Completed' },

  // Deductible & Financial
  deductible_title: { id: 'Potongan Platform 5%', en: '5% Platform Deductible' },
  deductible_desc: {
    id: 'Sesuai ketentuan polis, potongan wajib 5% diterapkan otomatis pada nilai klaim yang disetujui.',
    en: 'Per policy terms, a mandatory 5% deductible is automatically applied to approved claim payouts.',
  },
  net_payout: { id: 'Dana Bersih Diterima', en: 'Net Payout to User' },
  approved_amount: { id: 'Nilai Klaim Disetujui', en: 'Approved Amount' },
}

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  language: 'id',
  setLanguage: () => {},
  t: (key: string) => key,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id')

  useEffect(() => {
    const saved = localStorage.getItem('superclaim-lang') as Language
    if (saved === 'id' || saved === 'en') {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('superclaim-lang', lang)
  }

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language]
    }
    return key
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  return useContext(I18nContext)
}
