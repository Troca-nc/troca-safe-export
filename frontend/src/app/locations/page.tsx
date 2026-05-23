import { Suspense } from 'react'
import CategoryFeedPage from '@/components/listings/CategoryFeedPage'

export default function LocationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <CategoryFeedPage
        title="Locations courte durée"
        subtitle="Des bungalows, cases, studios et appartements à louer pour un week-end ou quelques jours."
        categorySlug="location_courte_duree"
        accentLabel="Nouvelle catégorie"
      />
    </Suspense>
  )
}
