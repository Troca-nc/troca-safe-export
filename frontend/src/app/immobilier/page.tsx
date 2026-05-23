import { Suspense } from 'react'
import CategoryFeedPage from '@/components/listings/CategoryFeedPage'

export default function ImmobilierPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <CategoryFeedPage
        title="Immobilier"
        subtitle="Annonces de vente et de location longue durée pour particuliers et professionnels."
        categorySlug="immobilier"
        accentLabel="Vente et location"
      />
    </Suspense>
  )
}
