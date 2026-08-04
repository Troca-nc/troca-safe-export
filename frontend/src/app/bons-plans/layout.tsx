import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Bons plans & ÃvÃ©nements NC | Kalico',
  description: 'Promos locales, ï¿½vï¿½nements culturels et agenda de Nouvelle-CalÃ©donie au mï¿½me endroit.',
  path: '/bons-plans',
})

export default function BonsPlansLayout({ children }: { children: React.ReactNode }) {
  return children
}
