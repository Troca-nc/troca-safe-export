// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { MobileBottomNav } from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CookieBanner from '@/components/layout/CookieBanner'
import AnalyticsTracker from '@/components/layout/AnalyticsTracker'
import JsonLd, { buildOrganizationSchema, buildWebSiteSchema } from '@/components/seo/JsonLd'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import PaymentFailureBanner from '@/components/PaymentFailureBanner'
import AuthRequiredModal from '@/components/auth/AuthRequiredModal'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Troca — Petites annonces Nouvelle-Calédonie',
  description: 'La première plateforme de petites annonces dédiée à la Nouvelle-Calédonie. Achetez, vendez, louez en toute confiance.',
  keywords: 'annonces, nouvelle-calédonie, noumea, vente, achat, immobilier, véhicules',
  openGraph: {
    title: 'Troca',
    description: 'Petites annonces Nouvelle-Calédonie',
    url: SITE_URL,
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export const viewport = {
  themeColor: '#0A7EA4',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      {/* pb-16 : compense la barre de nav fixe en bas sur mobile */}
      <body className="bg-sand-light dark:bg-night text-night dark:text-white font-body antialiased pb-16 md:pb-0">
        <ThemeProvider>
          <ReactQueryProvider>
            <JsonLd data={buildOrganizationSchema()} />
            <JsonLd data={buildWebSiteSchema()} />
            <AnalyticsTracker />
            <PaymentFailureBanner />
            <AuthRequiredModal />
            {children}
            <Footer />
            <MobileBottomNav />
            <CookieBanner />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
