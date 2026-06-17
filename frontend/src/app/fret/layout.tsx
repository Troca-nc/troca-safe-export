import type { Metadata } from 'next'

import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Fret & Transport NC | Kalico',
  description: 'Transport de marchandises, déménagement et retours à vide en Nouvelle-Calédonie.',
  path: '/fret',
})

export default function FretLayout({ children }: { children: React.ReactNode }) {
  return children
}
