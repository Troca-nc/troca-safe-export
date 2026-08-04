import type { Metadata } from 'next'

import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Fret & Transport NC | Kalico',
  description: 'Transport de marchandises, dï¿½mï¿½nagement et retours ï¿½ vide en Nouvelle-CalÃ©donie.',
  path: '/fret',
})

export default function FretLayout({ children }: { children: React.ReactNode }) {
  return children
}
