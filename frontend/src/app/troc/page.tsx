import type { Metadata } from 'next'

import TrocPageClient from './TrocPageClient'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Troc - �changes entre Cal�doniens | Kalico',
  description: 'Trouvez des objets � �changer en Nouvelle-Calédonie. Le Trocom�tre vous aide � trouver des �changes de valeur �quivalente.',
  path: '/troc',
})

export default function TrocPage() {
  return <TrocPageClient />
}
