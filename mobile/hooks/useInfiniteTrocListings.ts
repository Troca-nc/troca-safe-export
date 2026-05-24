import { useMemo } from 'react'
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'

import { trocApi } from '@/lib/api'
import { normalizeTrocListing, type TrocFeedItem } from '@/lib/trocNormalization'

export type InfiniteTrocFilters = Record<string, string | number | boolean | null | undefined>

type TrocPage = {
  data: unknown[]
  nextCursor: string | null
  pagination?: {
    total?: number
  }
}

function buildParams(filters: InfiniteTrocFilters, after?: string | null) {
  const params: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === '') continue
    params[key] = value as string | number | boolean
  }
  params.limit = typeof filters.limit === 'number' ? filters.limit : 25
  if (after) params.after = after
  return params
}

export function useInfiniteTrocListings(filters: InfiniteTrocFilters = {}, mode: 'list' | 'swipe' = 'swipe') {
  const query = useInfiniteQuery<TrocPage, Error, InfiniteData<TrocPage>, readonly unknown[], string | null>({
    queryKey: ['mobile.troc.infinite', mode, filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const params = buildParams(filters, pageParam)
      const response = mode === 'swipe'
        ? await trocApi.swipeFeed(params)
        : await trocApi.list(params)
      return response.data as TrocPage
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 30_000,
  })

  const listings = useMemo<TrocFeedItem[]>(() => {
    return query.data?.pages.flatMap((page: TrocPage) =>
      page.data.map((item: unknown) => normalizeTrocListing(item))
    ) ?? []
  }, [query.data])

  const total = useMemo(() => {
    const firstPage = query.data?.pages[0]
    return firstPage?.pagination?.total ?? listings.length
  }, [listings.length, query.data])

  return {
    ...query,
    listings,
    total,
  }
}
