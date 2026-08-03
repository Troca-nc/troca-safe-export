import type { Metadata } from 'next'

import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Envoi & Livraison | Kalico',
  description: 'Envoi de colis, d�m�nagement et fret pro en Nouvelle-Cal�donie.',
  path: '/envoi-livraison',
})

export default function EnvoiLivraisonLayout({ children }: { children: React.ReactNode }) {
  return children
}
