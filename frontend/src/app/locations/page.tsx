import { Suspense } from 'react'
import CategoryFeedPage from '@/components/listings/CategoryFeedPage'

export default function LocationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <CategoryFeedPage
        title="Locations courte durï¿½e"
        subtitle="Des bungalows, cases, studios et appartements ï¿½ louer pour un week-end ou quelques jours."
        categorySlug="location_courte_duree"
        accentLabel="Nouvelle catï¿½gorie"
      />
    </Suspense>
  )
}
