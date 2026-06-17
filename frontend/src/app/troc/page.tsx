import type { Metadata } from 'next'

import TrocPageClient from './TrocPageClient'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Troc — Échanges entre Calédoniens | Kalico',
  description: 'Trouvez des objets à échanger en Nouvelle-Calédonie. Le Trocomètre vous aide à trouver des échanges de valeur équivalente.',
  path: '/troc',
})

export default function TrocPage() {
  return <TrocPageClient />
}
