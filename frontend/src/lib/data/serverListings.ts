import { cache } from 'react'

import { demoOr } from '@/lib/demo'
import { serverPublicFetch } from '@/lib/serverPublicApi'
import type { ListingReview, ListingSearchItem } from '@/types/listings'
import {
  ListingNotFoundError,
  normalizeDetail,
  normalizeListing,
} from '@/lib/data/listings'

type UnknownRecord = Record<string, unknown>
const record = (value: unknown): UnknownRecord => value && typeof value === 'object' ? value as UnknownRecord : {}
const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0

export const getServerListingDetail = cache(async (id: string) => demoOr(
  async () => {
    const { demoListingDetails } = await import('@/demo/fixtures/listings')
    const listing = demoListingDetails[id]
    if (!listing) throw new ListingNotFoundError()
    return listing
  },
  async () => {
    const response = await serverPublicFetch(`/listings/${encodeURIComponent(id)}`, { cache: 'no-store' })
    if (response.status === 404) throw new ListingNotFoundError()
    if (!response.ok) throw new Error(`Listing request failed with status ${response.status}`)
    const payload = record(await response.json())
    return normalizeDetail(record(payload.data))
  },
))

export async function getServerListingReviews(sellerId: string): Promise<ListingReview[]> {
  if (!sellerId) return []
  return demoOr(
    async () => (await import('@/demo/fixtures/listings')).demoListingReviews[sellerId] ?? [],
    async () => {
      const response = await serverPublicFetch(`/users/${encodeURIComponent(sellerId)}/reviews`, { cache: 'no-store' })
      if (!response.ok) return []
      const payload = record(await response.json())
      const rows = Array.isArray(payload.data) ? payload.data : []
      return rows.map((value, index) => {
        const review = record(value)
        return {
          id: text(review.id) || String(index),
          rating: number(review.note ?? review.rating),
          comment: text(review.commentaire ?? review.comment) || null,
          created_at: text(review.created_at) || undefined,
          author_name: text(review.auteur_prenom ?? review.author_name) || 'Membre Kalico',
          author_avatar: text(review.auteur_avatar ?? review.author_avatar) || null,
        }
      })
    },
  )
}

export async function getServerSimilarListings(listing: Awaited<ReturnType<typeof getServerListingDetail>>): Promise<ListingSearchItem[]> {
  return demoOr(
    async () => (await import('@/demo/fixtures/listings')).demoListings
      .filter((item) => item.id !== listing.id && (!listing.category_slug || item.category_slug === listing.category_slug))
      .slice(0, 4),
    async () => {
      const params = new URLSearchParams({ limit: '8', sort: 'date' })
      if (listing.category_slug) params.set('category', listing.category_slug)
      const response = await serverPublicFetch(`/listings?${params}`, { cache: 'no-store' })
      if (!response.ok) return []
      const payload = record(await response.json())
      const values = Array.isArray(payload.data) ? payload.data : []
      return values
        .map(normalizeListing)
        .filter((item): item is ListingSearchItem => Boolean(item) && item.id !== listing.id)
        .slice(0, 4)
    },
  )
}
