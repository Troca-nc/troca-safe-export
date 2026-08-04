import type { Metadata } from 'next'

import TrocPageClient from './TrocPageClient'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Troc - ï¿½changes entre Calï¿½doniens | Kalico',
  description: 'Trouvez des objets ï¿½ ï¿½changer en Nouvelle-CalÃ©donie. Le Trocomï¿½tre vous aide ï¿½ trouver des ï¿½changes de valeur ï¿½quivalente.',
  path: '/troc',
})

export default function TrocPage() {
  return <TrocPageClient />
}
