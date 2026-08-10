import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Covoiturage en Nouvelle-Calédonie | Kalico',
  description: 'Trouvez un trajet ou proposez une place en covoiturage partout en Nouvelle-Calédonie.',
  path: '/covoiturage',
})

export default function CovoiturageLayout({ children }: { children: React.ReactNode }) {
  return children
}
