import { useCallback } from 'react'
import { Alert } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { favoritesApi, invalidateApiCache } from '@/lib/api'

export type FavoriteListing = {
  id: string
  titre: string
  prix: number | null
  cover_image: string | null
  commune: string | null
  category: string | null
}

type FavoritesQueryPayload = {
  data?: Array<Record<string, unknown>>
}

function toNullableString(value: unknown) {
  if (value == null) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function normalizeFavorite(item: FavoriteListing | Record<string, unknown>) {
  const source = item as Record<string, unknown>
  return {
    id: String((item as FavoriteListing).id ?? source.id ?? ''),
    titre: (item as FavoriteListing).titre ?? toNullableString(source.title) ?? '',
    title: toNullableString(source.title) ?? (item as FavoriteListing).titre ?? '',
    prix: (item as FavoriteListing).prix ?? (source.price as number | null | undefined) ?? null,
    price: (source.price as number | null | undefined) ?? (item as FavoriteListing).prix ?? null,
    commune: (item as FavoriteListing).commune ?? toNullableString(source.commune_name),
    commune_name: toNullableString(source.commune_name) ?? (item as FavoriteListing).commune,
    cover_image: (item as FavoriteListing).cover_image ?? toNullableString(source.cover_image),
    image_url: toNullableString(source.image_url) ?? (item as FavoriteListing).cover_image,
  }
}

export function useFavorite() {
  const queryClient = useQueryClient()

  // TODO: test E2E sur le toggle favori optimiste et le rollback en cas d'échec réseau.
  const mutation = useMutation({
    mutationFn: async (listing: FavoriteListing) => {
      await favoritesApi.toggleFavorite(listing.id)
      return listing
    },
    onMutate: async (listing) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] })
      const previous = queryClient.getQueryData<FavoritesQueryPayload>(['favorites'])
      const current = previous?.data ?? []
      const normalized = normalizeFavorite(listing)
      const next = current.some((item) => String(item.id) === listing.id)
        ? current.filter((item) => String(item.id) !== listing.id)
        : [normalized, ...current]

      queryClient.setQueryData<FavoritesQueryPayload>(['favorites'], {
        ...previous,
        data: next,
      })

      return { previous }
    },
    onError: (_error, _listing, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['favorites'], context.previous)
      }
      Alert.alert('Erreur', 'Une erreur est survenue')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      invalidateApiCache('favorites.')
      invalidateApiCache('listings.')
    },
  })

  return {
    toggleFavorite: useCallback((listing: FavoriteListing) => mutation.mutateAsync(listing), [mutation]),
    isPending: mutation.isPending,
  }
}
