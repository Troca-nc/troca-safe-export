import { Suspense } from 'react'
import CategoryFeedPage from '@/components/listings/CategoryFeedPage'

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <CategoryFeedPage
        title="Services entre particuliers"
        subtitle="Jardinage, rï¿½paration, cours, mï¿½nage, informatique et autres services locaux."
        categorySlug="services"
        accentLabel="Prestations locales"
      />
    </Suspense>
  )
}
