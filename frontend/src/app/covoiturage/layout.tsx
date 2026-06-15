import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Covoiturage - Kalico',
  description: 'Trouvez, publiez et réservez des trajets de covoiturage sécurisés en Nouvelle-Calédonie sur Kalico.',
}

export default function CovoiturageLayout({ children }: { children: React.ReactNode }) {
  return children
}
