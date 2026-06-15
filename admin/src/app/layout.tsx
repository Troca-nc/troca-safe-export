import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AdminShell } from '@/components/AdminShell'

export const metadata: Metadata = {
  title: 'Kalico Admin',
  description: 'Tableau de bord administrateur Kalico',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  )
}
