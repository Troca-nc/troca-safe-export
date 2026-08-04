import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Annonces - Kalico NC',
  description: 'Parcourez les petites annonces de Nouvelle-CalÃ©donie : vï¿½hicules, immobilier, emploi, ï¿½lectronique et bien plus.',
  path: '/annonces',
})

export default function AnnoncesLayout({ children }: { children: React.ReactNode }) {
  return children
}
