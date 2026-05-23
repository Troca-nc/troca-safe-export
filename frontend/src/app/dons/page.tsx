import { Suspense } from 'react'
import CategoryFeedPage from '@/components/listings/CategoryFeedPage'

export default function DonsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <CategoryFeedPage
        title="Dons d'objets"
        subtitle="Des objets offerts gratuitement, sans transaction financière, pour une plateforme plus responsable."
        categorySlug="don"
        accentLabel="Gratuit"
      />
    </Suspense>
  )
}
