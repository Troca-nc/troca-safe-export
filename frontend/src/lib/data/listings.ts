import { listingsApi, metaApi } from '@/lib/api'
import { FALLBACK_CATEGORIES, normalizeCategoryTree, type CategoryNode } from '@/lib/categoryCatalog'
import { demoOr } from '@/lib/demo'
import type {
  ListingCommune,
  ListingProvince,
  ListingSearchItem,
  ListingSearchParams,
  ListingsMetadata,
  ListingsPageResult,
} from '@/types/listings'

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
