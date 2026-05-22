import { useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

const LISTING_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const LISTING_RECENT_TTL_MS = 24 * 60 * 60 * 1000
const RECENT_LIMIT = 12

type StorageAdapter = {
  getString: (key: string) => string | null
  setString: (key: string, value: string) => void
  delete: (key: string) => void
}

type ListingSummarySource = {
  id: string | number
  titre?: string | null
  title?: string | null
  prix?: number | null
  price?: number | null
  commune_name?: string | null
  commune?: string | null
  image_url?: string | null
  cover_image?: string | null
  images?: Array<{
    url?: string | null
    thumbnail_url?: string | null
  }> | null
}

export type RecentlyViewedListing = {
  id: string
  title: string
  price: number | null
  commune: string | null
  image_url: string | null
  viewed_at: string
}

function createStorage(): StorageAdapter {
  if (Platform.OS === 'web') {
    return {
      getString: (key) => {
        try {
          return window.localStorage.getItem(key)
        } catch {
          return null
        }
      },
      setString: (key, value) => {
        try {
          window.localStorage.setItem(key, value)
        } catch {
          return
        }
      },
      delete: (key) => {
        try {
          window.localStorage.removeItem(key)
        } catch {
          return
        }
      },
    }
  }

  // Security: on mobile we keep the cache in MMKV for fast offline reads.
  // TODO: test E2E sur le cache hors ligne et la restauration des annonces vues.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv')
  const mmkv = new MMKV({ id: 'troca-mobile-cache' })
  return {
    getString: (key) => mmkv.getString(key) ?? null,
    setString: (key, value) => {
      mmkv.set(key, value)
    },
    delete: (key) => {
      mmkv.delete(key)
    },
  }
}

const localStorageAdapter = createStorage()

function isOfflineState(online: boolean | null | undefined, reachable: boolean | null | undefined) {
  if (online === false) return true
  if (reachable === false) return true
  return false
}

function toRecentListing(source: ListingSummarySource): RecentlyViewedListing {
  const image = source.image_url
    ?? source.cover_image
    ?? source.images?.[0]?.thumbnail_url
    ?? source.images?.[0]?.url
    ?? null

  return {
    id: String(source.id),
    title: source.titre ?? source.title ?? 'Annonce',
    price: source.prix ?? source.price ?? null,
    commune: source.commune_name ?? source.commune ?? null,
    image_url: image,
    viewed_at: new Date().toISOString(),
  }
}

function readRecentListings(): RecentlyViewedListing[] {
  const raw = localStorageAdapter.getString('recently_viewed_listings')
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as RecentlyViewedListing[]
    const cutoff = Date.now() - LISTING_RECENT_TTL_MS
    return parsed
      .filter((item) => item && item.id && item.viewed_at && new Date(item.viewed_at).getTime() >= cutoff)
      .sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime())
      .slice(0, RECENT_LIMIT)
  } catch {
    return []
  }
}

function writeRecentListings(items: RecentlyViewedListing[]) {
  localStorageAdapter.setString('recently_viewed_listings', JSON.stringify(items.slice(0, RECENT_LIMIT)))
}

export function recordRecentlyViewedListing(source: ListingSummarySource) {
  const entry = toRecentListing(source)
  const current = readRecentListings()
  const next = [entry, ...current.filter((item) => item.id !== entry.id)]
  writeRecentListings(next)
}

export function getRecentlyViewedListings() {
  return readRecentListings()
}

export function getListingQueryKey(kind: 'search' | 'detail' | 'user', args: unknown) {
  return ['listing-cache', kind, args] as const
}

export function cacheListingQuery(kind: 'search' | 'detail' | 'user', args: unknown, data: unknown) {
  queryClient.setQueryData(getListingQueryKey(kind, args), data)
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: LISTING_CACHE_TTL_MS,
      gcTime: LISTING_CACHE_TTL_MS,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'troca-mobile-react-query-cache',
  throttleTime: 1000,
})

void persistQueryClient({
  queryClient,
  persister,
  maxAge: LISTING_CACHE_TTL_MS,
  buster: 'troca-mobile-listing-cache-v1',
})

export function useOfflineStatus() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(isOfflineState(state.isConnected, state.isInternetReachable))
    })

    NetInfo.fetch()
      .then((state) => {
        setOffline(isOfflineState(state.isConnected, state.isInternetReachable))
      })
      .catch(() => {
        setOffline(true)
      })

    return () => unsubscribe()
  }, [])

  return useMemo(() => offline, [offline])
}
