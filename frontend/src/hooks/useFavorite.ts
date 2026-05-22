'use client'

import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, invalidateApiCache } from '@/lib/api'
import { useFavorisStore } from '@/store/favorisStore'

export type FavoriteListing = {
  id: string
  titre: string
  prix: number | null
  cover_image: string | null
  commune: string | null
  category: string | null
}

type FavoriteSnapshot = {
  ids: Set<string>
  items: Array<FavoriteListing & { savedAt?: string }>
  loading: Set<string>
}

function showFavoriteError() {
  if (typeof window !== 'undefined') {
    window.alert('Une erreur est survenue')
  }
}

export function useFavorite() {
  const queryClient = useQueryClient()
  const isSaved = useFavorisStore((state) => state.isSaved)
  const loading = useFavorisStore((state) => state.loading)

  // TODO: test E2E sur le toggle favori optimiste et le rollback en cas d'échec réseau.
  const mutation = useMutation({
    mutationFn: async (listing: FavoriteListing) => {
      await api.post(`/listings/${listing.id}/favoris`)
      return listing
    },
    onMutate: async (listing) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] })

      const current = useFavorisStore.getState()
      const wasSaved = current.ids.has(listing.id)
      const snapshot: FavoriteSnapshot = {
        ids: new Set(current.ids),
        items: [...current.items],
        loading: new Set(current.loading),
      }

      const nextLoading = new Set(current.loading)
      nextLoading.add(listing.id)

      if (wasSaved) {
        const nextIds = new Set(current.ids)
        nextIds.delete(listing.id)
        useFavorisStore.setState({
          ids: nextIds,
          items: current.items.filter((item) => item.id !== listing.id),
          loading: nextLoading,
        })
      } else {
        const nextIds = new Set(current.ids)
        nextIds.add(listing.id)
        useFavorisStore.setState({
          ids: nextIds,
          items: [{ ...listing, savedAt: new Date().toISOString() }, ...current.items],
          loading: nextLoading,
        })
      }

      return { snapshot, wasSaved, listing }
    },
    onError: (_error, _listing, context) => {
      if (context?.snapshot) {
        useFavorisStore.setState(context.snapshot)
      }
      showFavoriteError()
    },
    onSettled: (_data, _error, listing) => {
      const current = useFavorisStore.getState()
      const nextLoading = new Set(current.loading)
      nextLoading.delete(listing.id)
      useFavorisStore.setState({ loading: nextLoading })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      invalidateApiCache('favorites.')
      invalidateApiCache('listings.')
    },
  })

  const toggleFavorite = useCallback((listing: FavoriteListing) => mutation.mutateAsync(listing), [mutation])

  return {
    isFavorited: isSaved,
    isToggling: loading,
    toggleFavorite,
    pending: mutation.isPending,
  }
}
