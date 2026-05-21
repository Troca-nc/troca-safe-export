import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Evenements & culture - Troca',
  description: 'Concerts, festivals, marches, expositions et evenements locaux en Nouvelle-Caledonie sur Troca.',
}

export default function EvenementsLayout({ children }: { children: React.ReactNode }) {
  return children
}
