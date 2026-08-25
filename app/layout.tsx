import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'
import { NotificationDrawer } from '@/components/shared/notification-drawer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SuperClaim — Insurance Platform for Gadget & Electronics',
  description: 'Digital insurance ecosystem for gadget, wearables, and electronics connecting Backoffice, Dealers, and Users.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-900 text-slate-100`}>
        <I18nProvider>
          {children}
          <NotificationDrawer />
        </I18nProvider>
      </body>
    </html>
  )
}
