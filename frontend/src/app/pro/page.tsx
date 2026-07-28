import type { Metadata } from 'next'

import ProLandingPageClient from './ProLandingPageClient'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Devenir Pro — Kalico NC',
  description:
    'Créez votre espace Pro sur Kalico : vitrine, devis, réservations, transport, envoi & livraison et visibilité locale en Nouvelle-Calédonie.',
  alternates: {
    canonical: `${SITE_URL}/pro`,
  },
  openGraph: {
    title: 'Devenir Pro — Kalico NC',
    description:
      'Créez votre espace Pro sur Kalico : vitrine, devis, réservations, transport, envoi & livraison et visibilité locale en Nouvelle-Calédonie.',
    url: `${SITE_URL}/pro`,
    siteName: 'Kalico',
    locale: 'fr_NC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devenir Pro — Kalico NC',
    description:
      'Créez votre espace Pro sur Kalico : vitrine, devis, réservations, transport, envoi & livraison et visibilité locale en Nouvelle-Calédonie.',
  },
}

export default function ProPage() {
  return <ProLandingPageClient />
}
