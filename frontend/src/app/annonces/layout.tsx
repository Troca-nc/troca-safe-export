import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Annonces - Kalico NC',
  description: 'Parcourez les petites annonces de Nouvelle-Cal�donie : v�hicules, immobilier, emploi, �lectronique et bien plus.',
  path: '/annonces',
})

export default function AnnoncesLayout({ children }: { children: React.ReactNode }) {
  return children
}
