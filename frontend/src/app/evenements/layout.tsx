import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Événements en Nouvelle-Calédonie | Kalico',
  description: 'Concerts, marchés, expositions, sports — tout l’agenda calédonien sur Kalico.',
  path: '/evenements',
})

export default function EvenementsLayout({ children }: { children: React.ReactNode }) {
  return children
}
