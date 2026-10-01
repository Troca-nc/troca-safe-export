import { listingsApi, messagesApi, metaApi, usersApi } from '@/lib/api'
import { FALLBACK_CATEGORIES, normalizeCategoryTree, type CategoryNode } from '@/lib/categoryCatalog'
import { demoOr } from '@/lib/demo'
import type {
  ListingCommune,
  ListingProvince,
  ListingSearchItem,
  ListingSearchParams,
  ListingsMetadata,
  ListingsPageResult,
  ListingDetail,
  ListingDetailImage,
  ListingReview,
  ListingSeller,
} from '@/types/listings'

export class ListingNotFoundError extends Error {
  constructor() {
    super('Listing not found')
    this.name = 'ListingNotFoundError'
  }
}

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {}
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeListing(value: unknown): ListingSearchItem | null {
  const item = asRecord(value)
  const id = asText(item.id) || (typeof item.id === 'number' ? String(item.id) : '')
  const title = asText(item.title) || asText(item.titre)
  if (!id || !title) return null

  const price = asOptionalNumber(item.price ?? item.prix)
  return {
    id,
    type: asText(item.type) || undefined,
    title,
    price,
    price_negotiable: Boolean(item.price_negotiable ?? item.is_negotiable),
    is_free: Boolean(item.is_free),
    condition: asText(item.condition) || undefined,
    is_featured: Boolean(item.is_featured ?? item.boosted_until ?? item.boost_expires_at),
    is_urgent: Boolean(item.is_urgent),
    published_at: asText(item.published_at) || undefined,
    created_at: asText(item.created_at) || undefined,
    boosted_until: asText(item.boosted_until ?? item.boost_expires_at) || null,
    contre_quoi: asText(item.contre_quoi) || null,
    is_troc: Boolean(item.is_troc),
    commune_id: asText(item.commune_id) || (typeof item.commune_id === 'number' ? String(item.commune_id) : null),
    province_id: asText(item.province_id) || (typeof item.province_id === 'number' ? String(item.province_id) : null),
    commune_name: asText(item.commune_name) || undefined,
    category_name: asText(item.category_name) || undefined,
    category_slug: asText(item.category_slug) || undefined,
    category_icon: asText(item.category_icon) || undefined,
    cover_image: asText(item.cover_image ?? item.cover_image_thumbnail) || undefined,
    distance_km: asOptionalNumber(item.distance_km),
    metadata: asRecord(item.metadata),
    user_rating: asOptionalNumber(item.user_rating) ?? undefined,
    seller_trust_score: asOptionalNumber(item.seller_trust_score) ?? undefined,
    seller_email_verified: Boolean(item.seller_email_verified),
    seller_phone_verified: Boolean(item.seller_phone_verified),
    is_pro: Boolean(item.is_pro),
    seller_is_pro: Boolean(item.seller_is_pro),
    seller_pro_verified: Boolean(item.seller_pro_verified),
    seller_prenom: asText(item.seller_prenom) || null,
    seller_nom: asText(item.seller_nom) || null,
    seller_avatar: asText(item.seller_avatar) || null,
    seller_is_online: Boolean(item.seller_is_online),
    seller_last_seen_label: asText(item.seller_last_seen_label) || null,
    seller_avg_response_time_label: asText(item.seller_avg_response_time_label) || null,
    seller_note_moyenne: asOptionalNumber(item.seller_note_moyenne),
    seller_nb_avis: asOptionalNumber(item.seller_nb_avis),
  }
}

function normalizeCommune(value: unknown): ListingCommune | null {
  const commune = asRecord(value)
  const id = asText(commune.id) || (typeof commune.id === 'number' ? String(commune.id) : '')
  const name = asText(commune.name)
  if (!id || !name) return null
  return { id, name, slug: asText(commune.slug) || name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-') }
}

function normalizeProvince(value: unknown): ListingProvince | null {
  const province = asRecord(value)
  const id = asText(province.id) || (typeof province.id === 'number' ? String(province.id) : '')
  const name = asText(province.name)
  if (!id || !name) return null
  const communes = Array.isArray(province.communes)
    ? province.communes.map(normalizeCommune).filter((item): item is ListingCommune => Boolean(item))
    : []
  return { id, name, code: asText(province.code), communes }
}

function normalizeCategories(value: unknown): CategoryNode[] {
  return Array.isArray(value) && value.length > 0
    ? normalizeCategoryTree(value as CategoryNode[])
    : FALLBACK_CATEGORIES
}

function demoPage(params: ListingSearchParams, after?: string | null): Promise<ListingsPageResult> {
  return import('@/demo/fixtures/listings').then(({ demoListings }) => {
    const query = asText(params.q).toLocaleLowerCase('fr-FR')
    const min = asOptionalNumber(params.price_min)
    const max = asOptionalNumber(params.price_max)
    let data = demoListings.filter((listing) => {
      if (query && !`${listing.title} ${listing.category_name ?? ''}`.toLocaleLowerCase('fr-FR').includes(query)) return false
      if (params.category && listing.category_slug !== params.category) return false
      if (params.province_id && listing.province_id !== params.province_id) return false
      if (params.commune_id && listing.commune_id !== params.commune_id) return false
      if (params.condition && listing.condition !== params.condition) return false
      if (params.troc === 'true' && !listing.is_troc) return false
      if (min !== null && (listing.price === null || listing.price < min)) return false
      if (max !== null && (listing.price === null || listing.price > max)) return false
      return true
    })

    if (params.sort === 'price_asc') data = [...data].sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER))
    if (params.sort === 'price_desc') data = [...data].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))

    const limit = Math.max(1, Number(params.limit ?? 9))
    const offset = after?.startsWith('demo-offset-') ? asNumber(after.replace('demo-offset-', '')) : 0
    const pageData = data.slice(offset, offset + limit)
    const nextOffset = offset + pageData.length
    return {
      data: pageData,
      nextCursor: nextOffset < data.length ? `demo-offset-${nextOffset}` : null,
      pagination: {
        total: data.length,
        page: Math.floor(offset / limit) + 1,
        pages: Math.max(1, Math.ceil(data.length / limit)),
        limit,
      },
    }
  })
}

export async function getListingsPage(params: ListingSearchParams, after?: string | null): Promise<ListingsPageResult> {
  return demoOr(
    () => demoPage(params, after),
    async () => {
      const response = await listingsApi.search({ ...params, after: after || undefined })
      const payload = asRecord(response.data)
      const pagination = asRecord(payload.pagination)
      const data = Array.isArray(payload.data)
        ? payload.data.map(normalizeListing).filter((item): item is ListingSearchItem => Boolean(item))
        : []
      const limit = asNumber(pagination.limit, Number(params.limit ?? 9))
      const total = asNumber(pagination.total, data.length)
      return {
        data,
        nextCursor: asText(payload.nextCursor) || null,
        pagination: {
          total,
          page: asNumber(pagination.page, 1),
          pages: asNumber(pagination.pages, Math.max(1, Math.ceil(total / Math.max(1, limit)))),
          limit,
        },
      }
    },
  )
}

export async function getListingsMetadata(): Promise<ListingsMetadata> {
  return demoOr(
    async () => (await import('@/demo/fixtures/listings')).demoListingsMetadata,
    async () => {
      const [categoryResponse, communeResponse] = await Promise.all([metaApi.getCategories(), metaApi.getCommunes()])
      const categoryPayload = asRecord(categoryResponse.data)
      const communePayload = asRecord(communeResponse.data)
      const provinces = Array.isArray(communePayload.data)
        ? communePayload.data.map(normalizeProvince).filter((item): item is ListingProvince => Boolean(item))
        : []
      return { categories: normalizeCategories(categoryPayload.data), provinces }
    },
  )
}

export async function getListingZones(communeSlug: string): Promise<string[]> {
  if (!communeSlug) return []
  return demoOr(
    async () => (await import('@/demo/fixtures/listings')).demoZonesByCommune[communeSlug] ?? [],
    async () => {
      const response = await metaApi.getZones(communeSlug)
      const payload = asRecord(response.data)
      const data = asRecord(payload.data)
      return Array.isArray(data.zones) ? data.zones.map(asText).filter(Boolean) : []
    },
  )
}

function normalizeImage(value: unknown, index: number): ListingDetailImage | null {
  const image = asRecord(value)
  const url = asText(image.url ?? image.medium_url ?? image.original_url)
  if (!url) return null
  return { id: asText(image.id) || String(index), url, thumbnail_url: asText(image.thumbnail_url) || null, medium_url: asText(image.medium_url) || null }
}

function normalizeSeller(value: unknown): ListingSeller {
  const seller = asRecord(value)
  return {
    id: asText(seller.id) || String(seller.id ?? ''),
    first_name: asText(seller.prenom ?? seller.first_name) || 'Vendeur',
    last_name: asText(seller.nom ?? seller.last_name),
    avatar_url: asText(seller.avatar_url ?? seller.avatar) || null,
    is_pro: Boolean(seller.is_pro),
    pro_verified: Boolean(seller.pro_verified ?? seller.is_pro_verified),
    rating: asOptionalNumber(seller.note_moyenne ?? seller.rating),
    reviews_count: asOptionalNumber(seller.nb_avis ?? seller.reviews_count),
    listings_count: asOptionalNumber(seller.nb_annonces ?? seller.listings_count),
    member_since: asText(seller.created_at ?? seller.member_since) || null,
    commune_name: asText(seller.seller_commune_name ?? seller.commune_name) || null,
    province_name: asText(seller.seller_province_name ?? seller.province_name) || null,
    email_verified: Boolean(seller.email_verified),
    phone_verified: Boolean(seller.telephone_verifie ?? seller.phone_verified),
    trust_score: asOptionalNumber(seller.trust_score),
    is_online: Boolean(seller.is_online),
    last_seen_label: asText(seller.last_seen_label) || null,
    response_time_label: asText(seller.avg_response_time_label ?? seller.response_time_label) || null,
  }
}

function normalizeDetail(value: unknown): ListingDetail {
  const item = asRecord(value)
  const id = asText(item.id) || String(item.id ?? '')
  const title = asText(item.title ?? item.titre)
  if (!id || !title) throw new ListingNotFoundError()
  const images = Array.isArray(item.images) ? item.images.map(normalizeImage).filter((image): image is ListingDetailImage => Boolean(image)) : []
  return {
    id, title,
    price: asOptionalNumber(item.price ?? item.prix),
    price_negotiable: Boolean(item.price_negotiable ?? item.is_negotiable),
    is_free: Boolean(item.is_free),
    description: asText(item.description),
    condition: asText(item.condition),
    status: asText(item.status) || 'active',
    is_featured: Boolean(item.is_featured),
    is_urgent: Boolean(item.is_urgent),
    views_count: asNumber(item.nb_vues ?? item.views_count),
    favorites_count: asNumber(item.nb_favoris ?? item.favorites_count),
    commune_id: asText(item.commune_id) || null,
    commune_name: asText(item.commune_name) || null,
    commune_slug: asText(item.commune_slug) || null,
    category_id: asText(item.category_id) || null,
    category_name: asText(item.category_name) || null,
    category_slug: asText(item.category_slug) || null,
    category_icon: asText(item.category_icon) || null,
    published_at: asText(item.published_at) || undefined,
    created_at: asText(item.created_at) || undefined,
    updated_at: asText(item.updated_at) || undefined,
    contre_quoi: asText(item.contre_quoi) || null,
    is_troc: Boolean(item.is_troc),
    metadata: asRecord(item.metadata),
    images,
    seller: normalizeSeller(item.user ?? item.author ?? item.seller),
    is_favorited: Boolean(item.is_favorited),
  }
}

function responseStatus(error: unknown) {
  return asNumber(asRecord(asRecord(error).response).status)
}

export async function getListingDetail(id: string): Promise<ListingDetail> {
  return demoOr(
    async () => {
      const { demoListingDetails } = await import('@/demo/fixtures/listings')
      const listing = demoListingDetails[id]
      if (!listing) throw new ListingNotFoundError()
      return listing
    },
    async () => {
      try {
        const response = await listingsApi.getById(id)
        return normalizeDetail(asRecord(response.data).data)
      } catch (error) {
        if (responseStatus(error) === 404) throw new ListingNotFoundError()
        throw error
      }
    },
  )
}

export async function getListingReviews(sellerId: string): Promise<ListingReview[]> {
  if (!sellerId) return []
  return demoOr(
    async () => (await import('@/demo/fixtures/listings')).demoListingReviews[sellerId] ?? [],
    async () => {
      const response = await usersApi.getReviews(sellerId)
      const payload = asRecord(response.data)
      const rows = Array.isArray(payload.data) ? payload.data : []
      return rows.map((value, index) => {
        const review = asRecord(value)
        return {
          id: asText(review.id) || String(index),
          rating: asNumber(review.note ?? review.rating),
          comment: asText(review.commentaire ?? review.comment) || null,
          created_at: asText(review.created_at) || undefined,
          author_name: asText(review.auteur_prenom ?? review.author_name) || 'Membre Kalico',
          author_avatar: asText(review.auteur_avatar ?? review.author_avatar) || null,
        }
      })
    },
  )
}

export async function getSimilarListings(listing: ListingDetail): Promise<ListingSearchItem[]> {
  const page = await getListingsPage({ category: listing.category_slug || undefined, limit: 8, sort: 'date' })
  return page.data.filter((item) => item.id !== listing.id).slice(0, 4)
}

export async function contactListingSeller(listingId: string, message: string) {
  const response = await messagesApi.startConversation({ annonce_id: Number(listingId), message })
  const payload = asRecord(response.data)
  const data = asRecord(payload.data)
  return asText(data.conversation_id ?? data.conversationId ?? payload.conversation_id ?? payload.conversationId ?? payload.id)
}

export async function reportListing(listingId: string, reason: string, comment: string) {
  await listingsApi.report(listingId, { reason, comment })
}
