import type { Metadata } from 'next'

import ProUpgradeFlow from '@/components/monetisation/ProUpgradeFlow'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Devenir Pro - Kalico NC',
  description: 'Transformez votre compte Kalico en espace professionnel sans perdre vos annonces, avis et conversations.',
  alternates: { canonical: `${SITE_URL}/devenir-pro` },
  openGraph: {
    title: 'Devenir Pro - Kalico NC',
    description: 'Créez votre vitrine professionnelle Kalico avec votre compte actuel.',
    url: `${SITE_URL}/devenir-pro`,
    siteName: 'Kalico',
    locale: 'fr_NC',
    type: 'website',
  },
}

export default function DevenirProPage() {
  return <ProUpgradeFlow />
}
