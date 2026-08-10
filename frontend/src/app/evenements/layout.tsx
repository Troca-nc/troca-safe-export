import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Événements en Nouvelle-Calédonie | Kalico',
  description: 'Concerts, marchés, conférences — tous les événements NC sur Kalico.',
  path: '/evenements',
})

export default function EvenementsLayout({ children }: { children: React.ReactNode }) {
  return children
}
