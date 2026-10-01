'use client'

import ListingsPageView from '@/components/listings/ListingsPageView'

type CategoryFeedPageProps = {
  title: string
  subtitle: string
  categorySlug: string
  accentLabel: string
}

export default function CategoryFeedPage(props: CategoryFeedPageProps) {
  return <ListingsPageView {...props} />
}
