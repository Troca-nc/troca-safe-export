import type { Metadata } from 'next'

import AdvertisingPageView from '@/components/monetisation/AdvertisingPageView'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Kalico Pub - Publicité locale en Nouvelle-Calédonie',
  description: 'Découvrez les formats publicitaires disponibles sur Kalico et préparez une campagne locale depuis votre espace Pro.',
  alternates: { canonical: `${SITE_URL}/publicite` },
  openGraph: {
    title: 'Kalico Pub - Publicité locale',
    description: 'Formats, tarifs serveur et accompagnement pour préparer votre campagne locale sur Kalico.',
    url: `${SITE_URL}/publicite`,
    siteName: 'Kalico',
    locale: 'fr_NC',
    type: 'website',
  },
}

export default function PublicitePage() {
  return <AdvertisingPageView />
}
