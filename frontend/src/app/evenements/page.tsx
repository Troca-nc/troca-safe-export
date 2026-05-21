'use client'

import Header from '@/components/layout/Header'
import { ServiceDirectoryPage } from '@/components/services/ServiceDirectoryPage'

export default function EvenementsPage() {
  return (
    <div className="min-h-screen bg-sand-light text-night">
      <Header />
      <ServiceDirectoryPage
        title="Evenements & culture"
        eyebrow="Agenda local"
        description="Retrouvez les concerts, festivals, marches, animations et sorties communautaires les plus proches de vous."
        kind="event,concert"
        mode="event"
        searchPlaceholder="Rechercher un evenement, une salle, un artiste..."
        introPoints={['Calendrier', 'Carte', 'Billetterie', 'Favoris']}
      />
    </div>
  )
}
