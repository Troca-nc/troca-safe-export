import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Annonces en Nouvelle-Calédonie | Kalico',
  description: 'Achetez, vendez et échangez en Nouvelle-Calédonie. Véhicules, immobilier, services et plus encore sur Kalico.',
  path: '/annonces',
})

export default function AnnoncesLayout({ children }: { children: React.ReactNode }) {
  return children
}
