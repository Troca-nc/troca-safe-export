import type { Metadata } from 'next'

import Header from '@/components/layout/Header'
import ProsDirectoryClient from './ProsDirectoryClient'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Annuaire des pros - Kalico NC',
  description:
    'D�couvrez les professionnels v�rifi�s de Nouvelle-Cal�donie. Filtrez par cat�gorie, commune et note pour trouver le bon partenaire local.',
  alternates: {
    canonical: `${SITE_URL}/pros`,
  },
  openGraph: {
    title: 'Annuaire des pros - Kalico NC',
    description:
      'D�couvrez les professionnels v�rifi�s de Nouvelle-Cal�donie. Filtrez par cat�gorie, commune et note pour trouver le bon partenaire local.',
    url: `${SITE_URL}/pros`,
    siteName: 'Kalico',
    locale: 'fr_NC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Annuaire des pros - Kalico NC',
    description:
      'D�couvrez les professionnels v�rifi�s de Nouvelle-Cal�donie. Filtrez par cat�gorie, commune et note pour trouver le bon partenaire local.',
  },
}

export default function ProsDirectoryPage() {
  return (
    <>
      <Header />
      <ProsDirectoryClient />
    </>
  )
}
