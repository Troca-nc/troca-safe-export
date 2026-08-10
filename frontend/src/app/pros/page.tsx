import type { Metadata } from 'next'

import Header from '@/components/layout/Header'
import ProsDirectoryClient from './ProsDirectoryClient'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Professionnels en Nouvelle-Calédonie | Kalico',
  description:
    'Trouvez des artisans et professionnels vérifiés en Nouvelle-Calédonie.',
  alternates: {
    canonical: `${SITE_URL}/pros`,
  },
  openGraph: {
    title: 'Professionnels en Nouvelle-Calédonie | Kalico',
    description:
      'Trouvez des artisans et professionnels vérifiés en Nouvelle-Calédonie.',
    url: `${SITE_URL}/pros`,
    siteName: 'Kalico',
    locale: 'fr_NC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Professionnels en Nouvelle-Calédonie | Kalico',
    description:
      'Trouvez des artisans et professionnels vérifiés en Nouvelle-Calédonie.',
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
