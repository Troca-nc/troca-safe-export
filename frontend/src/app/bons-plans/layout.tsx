import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Bons plans en Nouvelle-Calédonie | Kalico',
  description: 'Promotions et offres locales en Nouvelle-Calédonie.',
  path: '/bons-plans',
})

export default function BonsPlansLayout({ children }: { children: React.ReactNode }) {
  return children
}
