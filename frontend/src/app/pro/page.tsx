import type { Metadata } from 'next'

import ProLandingPageClient from './ProLandingPageClient'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Espace Professionnel — Troca NC',
  description:
    'Développez votre activité en Nouvelle-Calédonie avec Troca Pro. Vitrine locale, annonces prioritaires, statistiques et clients ciblés.',
  alternates: {
    canonical: `${SITE_URL}/pro`,
  },
  openGraph: {
    title: 'Espace Professionnel — Troca NC',
    description:
      'Développez votre activité en Nouvelle-Calédonie avec Troca Pro. Vitrine locale, annonces prioritaires, statistiques et clients ciblés.',
    url: `${SITE_URL}/pro`,
    siteName: 'Troca',
    locale: 'fr_NC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Espace Professionnel — Troca NC',
    description:
      'Développez votre activité en Nouvelle-Calédonie avec Troca Pro. Vitrine locale, annonces prioritaires, statistiques et clients ciblés.',
  },
}

export default function ProPage() {
  return <ProLandingPageClient />
}
