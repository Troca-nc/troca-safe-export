// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
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
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import ContextualTooltips from '@/components/onboarding/ContextualTooltips'
import { DEFAULT_OG_IMAGE, SITE_LOCALE, SITE_NAME, SITE_TWITTER, SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Kalico - Petites annonces Nouvelle-Calédonie',
  description: 'La premi�re plateforme de petites annonces d�di�e � la Nouvelle-Calédonie. Achetez, vendez, louez en toute confiance.',
  keywords: 'annonces, nouvelle-cal�donie, noumea, vente, achat, immobilier, v�hicules',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdf8f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0c2a35' },
  ],
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
      <body className="bg-[var(--color-bg-page)] text-[var(--color-text-primary)] font-body antialiased overflow-x-clip pt-20 md:overflow-x-visible">
        <ThemeProvider>
          <ReactQueryProvider>
            <JsonLd data={buildOrganizationSchema()} />
            <JsonLd data={buildWebSiteSchema()} />
            <AnalyticsTracker />
            <DemoBanner />
            <ToastCenter />
            <PaymentFailureBanner />
            <AuthRequiredModal />
            <OnboardingChecklist />
            <ContextualTooltips />
            {children}
            <Footer />
            <CookieBanner />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
