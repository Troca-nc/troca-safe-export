import { listingsApi, proApi } from '@/lib/api'
import { FALLBACK_CATEGORIES } from '@/lib/categoryCatalog'
import { demoOr } from '@/lib/demo'
import { GEO_DATA } from '@/shared-copy/geoData'
import type { HomeCategory, HomeCommune, HomeListing, HomeNavigation, HomePro } from '@/types/home'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {}
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

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeListing(value: unknown): HomeListing | null {
  const item = asRecord(value)
  const id = asText(item.id) || (typeof item.id === 'number' ? String(item.id) : '')
  const title = asText(item.title) || asText(item.titre)
  if (!id || !title) return null

  const price = asOptionalNumber(item.price ?? item.prix)
  const boostedUntil = asText(item.boosted_until ?? item.boost_expires_at) || null

  return {
    id,
    type: asText(item.type) || undefined,
    title,
    price,
    price_negotiable: Boolean(item.price_negotiable ?? item.is_negotiable),
    is_free: Boolean(item.is_free) || price === null,
    condition: asText(item.condition) || undefined,
    is_featured: Boolean(item.is_featured) || Boolean(boostedUntil),
    is_urgent: Boolean(item.is_urgent),
    published_at: asText(item.published_at) || undefined,
    created_at: asText(item.created_at) || undefined,
    boosted_until: boostedUntil,
    commune_name: asText(item.commune_name) || undefined,
    category_name: asText(item.category_name) || undefined,
    category_slug: asText(item.category_slug) || undefined,
    category_icon: asText(item.category_icon) || undefined,
    cover_image: asText(item.cover_image ?? item.cover_image_thumbnail) || undefined,
    distance_km: asOptionalNumber(item.distance_km),
    seller_prenom: asText(item.seller_prenom) || null,
    seller_nom: asText(item.seller_nom) || null,
    seller_avatar: asText(item.seller_avatar) || null,
    seller_note_moyenne: asOptionalNumber(item.seller_note_moyenne ?? item.user_rating),
    seller_nb_avis: asOptionalNumber(item.seller_nb_avis),
    seller_pro_verified: Boolean(item.seller_pro_verified),
    seller_email_verified: Boolean(item.seller_email_verified),
    seller_phone_verified: Boolean(item.seller_phone_verified),
    is_pro: Boolean(item.is_pro),
  }
}

function normalizePro(value: unknown): HomePro | null {
  const item = asRecord(value)
  const id = asText(item.id) || (typeof item.id === 'number' ? String(item.id) : '')
  const displayName = asText(item.display_name ?? item.pro_company_name)
  if (!id || !displayName) return null

  return {
    id,
    displayName,
    category: asText(item.pro_category) || null,
    commune: asText(item.pro_commune) || null,
    description: asText(item.pro_description) || null,
    rating: asNumber(item.avg_rating),
    reviewCount: asNumber(item.review_count),
    logoUrl: asText(item.pro_logo_url) || null,
  }
}

function getCategoryHint(category: (typeof FALLBACK_CATEGORIES)[number]) {
  const children = category.children || category.subcategories || []
  return children.slice(0, 3).map((child) => child.name.toLocaleLowerCase('fr-FR')).join(', ') || 'Voir les annonces'
}

export function getHomeNavigation(): HomeNavigation {
  const categories: HomeCategory[] = FALLBACK_CATEGORIES.slice(0, 8).map((category) => ({
    name: category.name,
    slug: category.slug,
    initial: category.name.trim().charAt(0).toLocaleUpperCase('fr-FR') || 'K',
    hint: getCategoryHint(category),
  }))

  const provinces = Object.values(GEO_DATA as Record<string, { communes?: Array<{ name?: string; slug?: string }> }>)
  const communes: HomeCommune[] = provinces
    .flatMap((province) => province.communes || [])
    .map((commune) => ({ name: asText(commune.name), slug: asText(commune.slug) }))
    .filter((commune) => commune.name && commune.slug)
    .slice(0, 10)

  return { categories, communes }
}

export async function getHomeListings(): Promise<HomeListing[]> {
  return demoOr(
    async () => (await import('@/demo/fixtures/home')).homeListings,
    async () => {
      const response = await listingsApi.search({ limit: 8, sort: 'date' })
      const values = Array.isArray(response.data?.data) ? response.data.data : []
      return values.map(normalizeListing).filter((listing): listing is HomeListing => Boolean(listing))
    },
  )
}

export async function getHomePros(): Promise<HomePro[]> {
  return demoOr(
    async () => (await import('@/demo/fixtures/home')).homePros,
    async () => {
      const response = await proApi.list({ limit: 4, page: 1 })
      const values = Array.isArray(response.data?.data) ? response.data.data : []
      return values.map(normalizePro).filter((pro): pro is HomePro => Boolean(pro)).slice(0, 4)
    },
  )
}
