import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: '�v�nements en Nouvelle-Cal�donie | Kalico',
  description: 'Concerts, march�s, expositions, sports - tout lagenda cal�donien sur Kalico.',
  path: '/evenements',
})

export default function EvenementsLayout({ children }: { children: React.ReactNode }) {
  return children
}
