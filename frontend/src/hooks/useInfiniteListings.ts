'use client'

import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api'

export type InfiniteListingFilters = Record<string, string | number | boolean | null | undefined>

type ListingsPage = {
  data?: Array<Record<string, unknown>>
  nextCursor?: string | null
  pagination?: {
    total?: number
    page?: number
    pages?: number
    limit?: number
  }
}

function buildParams(filters: InfiniteListingFilters, after?: string | null) {
  const params: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === '') continue
    if (typeof value === 'boolean') {
      params[key] = value ? 'true' : 'false'
      continue
    }
    params[key] = value
  }
  params.limit = Number(filters.limit ?? 24)
  if (after) params.after = after
  return params
}

export function useInfiniteListings(filters: InfiniteListingFilters) {
  const query = useInfiniteQuery<ListingsPage>({
    queryKey: ['listings.infinite', filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const cursor = typeof pageParam === 'string' ? pageParam : null
      const params = buildParams(filters, cursor)
      const response = await listingsApi.search(params)
      return response.data as ListingsPage
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    staleTime: 30_000,
    retry: 1,
  })

  const listings = useMemo(
    () => query.data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [query.data]
  )

  const total = query.data?.pages[0]?.pagination?.total ?? 0

  return {
    ...query,
    listings,
    total,
  }
}
