import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Covoiturage NC - Trajets Nouvelle-Cal�donie',
  description: 'Trouvez ou proposez un trajet en covoiturage partout en Nouvelle-Cal�donie. Simple, local, entre Cal�doniens.',
  path: '/covoiturage',
})

export default function CovoiturageLayout({ children }: { children: React.ReactNode }) {
  return children
}
