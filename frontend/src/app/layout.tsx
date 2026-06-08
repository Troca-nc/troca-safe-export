// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { MobileBottomNav } from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CookieBanner from '@/components/legal/CookieBanner'
import AnalyticsTracker from '@/components/layout/AnalyticsTracker'
import JsonLd, { buildOrganizationSchema, buildWebSiteSchema } from '@/components/seo/JsonLd'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import PaymentFailureBanner from '@/components/PaymentFailureBanner'
import AuthRequiredModal from '@/components/auth/AuthRequiredModal'
import DemoBanner from '@/components/DemoBanner'
import MswInitializer from '@/components/testing/MswInitializer'
import ToastCenter from '@/components/ui/ToastCenter'
import OnboardingWizard from '@/components/OnboardingWizard'
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
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='theme';var legacy='troca-theme';var saved=localStorage.getItem(k)||localStorage.getItem(legacy);var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=(saved==='dark'||saved==='light')?saved:(prefersDark?'dark':'light');var root=document.documentElement;root.classList.toggle('dark',theme==='dark');root.dataset.theme=theme;root.style.colorScheme=theme;}catch(e){}})();`,
          }}
        />
      </head>
      {/* pb-16 : compense la barre de nav fixe en bas sur mobile */}
      <body className="bg-[var(--color-bg-page)] text-[var(--color-text-primary)] font-body antialiased pb-16 pt-14 md:pb-0 md:pt-14">
        <ThemeProvider>
          <ReactQueryProvider>
            <JsonLd data={buildOrganizationSchema()} />
            <JsonLd data={buildWebSiteSchema()} />
            <AnalyticsTracker />
            <DemoBanner />
            <MswInitializer />
            <ToastCenter />
            <PaymentFailureBanner />
            <AuthRequiredModal />
            <OnboardingWizard />
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
