import type { Metadata } from 'next'

import ProLandingPageClient from './ProLandingPageClient'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Devenir Pro - Kalico NC',
  description:
    'Cr�ez votre espace Pro sur Kalico : vitrine, devis, r�servations, transport, envoi & livraison et visibilit� locale en Nouvelle-Cal�donie.',
  alternates: {
    canonical: `${SITE_URL}/pro`,
  },
  openGraph: {
    title: 'Devenir Pro - Kalico NC',
    description:
      'Cr�ez votre espace Pro sur Kalico : vitrine, devis, r�servations, transport, envoi & livraison et visibilit� locale en Nouvelle-Cal�donie.',
    url: `${SITE_URL}/pro`,
    siteName: 'Kalico',
    locale: 'fr_NC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devenir Pro - Kalico NC',
    description:
      'Cr�ez votre espace Pro sur Kalico : vitrine, devis, r�servations, transport, envoi & livraison et visibilit� locale en Nouvelle-Cal�donie.',
  },
}

export default function ProPage() {
  return <ProLandingPageClient />
}
