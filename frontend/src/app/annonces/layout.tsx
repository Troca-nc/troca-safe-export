import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: {
    default: 'Annonces | Troca',
    template: '%s | Troca',
  },
  description: 'Parcourez les petites annonces de Nouvelle-Calédonie sur Troca.',
  alternates: {
    canonical: `${SITE_URL}/annonces`,
  },
  openGraph: {
    title: 'Annonces | Troca',
    description: 'Parcourez les petites annonces de Nouvelle-Calédonie sur Troca.',
    url: `${SITE_URL}/annonces`,
    siteName: SITE_NAME,
    locale: 'fr_NC',
    type: 'website',
  },
}

export default function AnnoncesLayout({ children }: { children: React.ReactNode }) {
  return children
}
