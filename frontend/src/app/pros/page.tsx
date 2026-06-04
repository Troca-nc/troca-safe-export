import ProsDirectoryClient from './ProsDirectoryClient'

export const metadata = {
  title: 'Annuaire des pros — Troca NC',
  description:
    'Découvrez les professionnels vérifiés de Nouvelle-Calédonie. Filtrez par catégorie, commune et note pour trouver le bon partenaire local.',
}

export default function ProsDirectoryPage() {
  return <ProsDirectoryClient />
}
