import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Bons plans & Événements NC | Kalico',
  description: 'Promos locales, �v�nements culturels et agenda de Nouvelle-Calédonie au m�me endroit.',
  path: '/bons-plans',
})

export default function BonsPlansLayout({ children }: { children: React.ReactNode }) {
  return children
}
