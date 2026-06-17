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
import ToastCenter from '@/components/ui/ToastCenter'
import OnboardingWizard from '@/components/OnboardingWizard'
import { DEFAULT_OG_IMAGE, SITE_LOCALE, SITE_NAME, SITE_TWITTER, SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Kalico — Petites annonces Nouvelle-Calédonie',
  description: 'La première plateforme de petites annonces dédiée à la Nouvelle-Calédonie. Achetez, vendez, louez en toute confiance.',
  keywords: 'annonces, nouvelle-calédonie, noumea, vente, achat, immobilier, véhicules',
  openGraph: {
    title: SITE_NAME,
    description: 'Petites annonces Nouvelle-Calédonie',
    url: SITE_URL,
    locale: SITE_LOCALE,
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  alternates: {
    canonical: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'Petites annonces Nouvelle-Calédonie',
    images: [DEFAULT_OG_IMAGE],
    site: SITE_TWITTER,
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
            __html: `(function(){try{var k='theme';var legacy='kalico-theme';var saved=localStorage.getItem(k)||localStorage.getItem(legacy);var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=(saved==='dark'||saved==='light')?saved:(prefersDark?'dark':'light');var root=document.documentElement;root.classList.toggle('dark',theme==='dark');root.dataset.theme=theme;root.style.colorScheme=theme;}catch(e){}})();`,
          }}
        />
      </head>
      {/* pb-16 : compense la barre de nav fixe en bas sur mobile */}
      <body className="bg-[var(--color-bg-page)] text-[var(--color-text-primary)] font-body antialiased overflow-x-clip pb-[calc(5rem+env(safe-area-inset-bottom))] pt-14 md:overflow-x-visible md:pb-0 md:pt-14">
        <ThemeProvider>
          <ReactQueryProvider>
            <JsonLd data={buildOrganizationSchema()} />
            <JsonLd data={buildWebSiteSchema()} />
            <AnalyticsTracker />
            <DemoBanner />
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
