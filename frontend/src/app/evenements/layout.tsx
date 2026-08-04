import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'ï¿½vï¿½nements en Nouvelle-CalÃ©donie | Kalico',
  description: 'Concerts, marchï¿½s, expositions, sports - tout lagenda calï¿½donien sur Kalico.',
  path: '/evenements',
})

export default function EvenementsLayout({ children }: { children: React.ReactNode }) {
  return children
}
