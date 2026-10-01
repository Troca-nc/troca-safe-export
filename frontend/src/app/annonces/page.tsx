import { Suspense } from 'react'

import { ListingSkeletonGrid } from '@/components/ListingSkeleton'
import ListingsPageView from '@/components/listings/ListingsPageView'

export default function AnnoncesPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-container px-4 py-10 sm:px-6 lg:px-12"><ListingSkeletonGrid count={9} className="grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" /></main>}>
      <ListingsPageView />
    </Suspense>
  )
}
