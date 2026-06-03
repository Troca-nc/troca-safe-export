import type { Metadata } from 'next'

import ProLandingPageClient from './ProLandingPageClient'

export const metadata: Metadata = {
  title: 'Espace Professionnel — Troca NC',
  description:
    'Développez votre activité en Nouvelle-Calédonie avec Troca Pro. Vitrine locale, annonces prioritaires, statistiques et clients ciblés.',
}

export default function ProPage() {
  return <ProLandingPageClient />
}
