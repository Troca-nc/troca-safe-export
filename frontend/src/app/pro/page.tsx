import type { Metadata } from 'next'

import ProLandingPageClient from './ProLandingPageClient'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Devenir Pro - Kalico NC',
  description:
    'Crï¿½ez votre espace Pro sur Kalico : vitrine, devis, rÃ©servations, transport, envoi & livraison et visibilitï¿½ locale en Nouvelle-CalÃ©donie.',
  alternates: {
    canonical: `${SITE_URL}/pro`,
  },
  openGraph: {
    title: 'Devenir Pro - Kalico NC',
    description:
      'Crï¿½ez votre espace Pro sur Kalico : vitrine, devis, rÃ©servations, transport, envoi & livraison et visibilitï¿½ locale en Nouvelle-CalÃ©donie.',
    url: `${SITE_URL}/pro`,
    siteName: 'Kalico',
    locale: 'fr_NC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devenir Pro - Kalico NC',
    description:
      'Crï¿½ez votre espace Pro sur Kalico : vitrine, devis, rÃ©servations, transport, envoi & livraison et visibilitï¿½ locale en Nouvelle-CalÃ©donie.',
  },
}

export default function ProPage() {
  return <ProLandingPageClient />
}
