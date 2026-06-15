import type { Metadata } from 'next'

import ProLandingPageClient from './ProLandingPageClient'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Espace Professionnel — Kalico NC',
  description:
    'Développez votre activité en Nouvelle-Calédonie avec Kalico Pro. Vitrine locale, annonces prioritaires, statistiques et clients ciblés.',
  alternates: {
    canonical: `${SITE_URL}/pro`,
  },
  openGraph: {
    title: 'Espace Professionnel — Kalico NC',
    description:
      'Développez votre activité en Nouvelle-Calédonie avec Kalico Pro. Vitrine locale, annonces prioritaires, statistiques et clients ciblés.',
    url: `${SITE_URL}/pro`,
    siteName: 'Kalico',
    locale: 'fr_NC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Espace Professionnel — Kalico NC',
    description:
      'Développez votre activité en Nouvelle-Calédonie avec Kalico Pro. Vitrine locale, annonces prioritaires, statistiques et clients ciblés.',
  },
}

export default function ProPage() {
  return <ProLandingPageClient />
}
