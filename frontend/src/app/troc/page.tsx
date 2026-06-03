import type { Metadata } from 'next'

import TrocPageClient from './TrocPageClient'

export const metadata: Metadata = {
  title: 'Troc — Échanges entre Calédoniens | Troca',
  description:
    'Trouvez des objets à échanger en Nouvelle-Calédonie. Parcourez les annonces troc disponibles et utilisez le Trocômètre pour trouver des échanges de valeur équivalente.',
}

export default function TrocPage() {
  return <TrocPageClient />
}
