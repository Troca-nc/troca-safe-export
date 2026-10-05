import { api, listingsApi, messagesApi, trocApi } from '@/lib/api'
import { DEMO } from '@/lib/demo'
import type { AccountSession } from '@/types/account'
import type { AlertFilters, SearchAlert } from '@/types/alert.types'
import type {
  AlertRecentResult,
  PersonalFavorite,
  PersonalListing,
  PersonalListingsData,
  PersonalOffer,
  PriceOffer,
  TrocOffer,
} from '@/types/personal-account'

type UnknownRecord = Record<string, unknown>

const record = (value: unknown): UnknownRecord => value && typeof value === 'object' ? value as UnknownRecord : {}
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : []
const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const number = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const nullableNumber = (value: unknown) => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value)
const nullableText = (value: unknown) => text(value) || null
const isDemoSession = (session: AccountSession) => DEMO || String(session.id).startsWith('demo-')

function normalizeListing(value: unknown): PersonalListing {
  const row = record(value)
  return {
    id: String(row.id ?? ''),
    title: text(row.titre ?? row.title) || 'Annonce',
    price: nullableNumber(row.prix ?? row.price),
    status: (text(row.status) || 'pending') as PersonalListing['status'],
    categoryName: text(row.category_name),
    communeName: text(row.commune_name),
    coverImage: nullableText(row.cover_image),
    views: number(row.view_count ?? row.views),
    favorites: number(row.favorite_count ?? row.nb_favoris),
    messages: number(row.message_count),
    publishedAt: nullableText(row.published_at ?? row.created_at),
    expiresAt: nullableText(row.expires_at),
    isTroc: Boolean(row.is_troc),
  }
}

function normalizeFavorite(value: unknown): PersonalFavorite {
  const row = record(value)
  return {
    id: String(row.id ?? ''),
    title: text(row.titre ?? row.title) || 'Annonce',
    price: nullableNumber(row.prix ?? row.price),
    status: text(row.status) || 'active',
    categoryName: text(row.category_name),
    communeName: text(row.commune_name),
    coverImage: nullableText(row.cover_image),
    savedAt: nullableText(row.favorited_at),
    // La production ne déduit jamais une baisse sans prix mémorisé au moment du favori.
    priceDropXpf: null,
  }
}

function normalizePriceOffer(value: unknown): PriceOffer {
  const row = record(value)
  const firstName = text(row.buyer_first_name)
  const lastName = text(row.buyer_last_name)
  return {
    kind: 'price',
    id: String(row.id ?? ''),
    status: text(row.status) || 'pending',
    listingId: String(row.listing_id ?? ''),
    listingTitle: text(row.listing_title) || 'Annonce',
    listingImage: nullableText(row.listing_image),
    personName: [firstName, lastName].filter(Boolean).join(' ') || 'Acheteur',
    personAvatarUrl: nullableText(row.buyer_avatar_url),
    rating: nullableNumber(row.buyer_rating),
    offeredXpf: number(row.amount_xpf),
    askingXpf: nullableNumber(row.asking_price_xpf),
    createdAt: text(row.created_at) || new Date(0).toISOString(),
    expiresAt: nullableText(row.expires_at),
  }
}

function normalizeTrocOffer(value: unknown): TrocOffer {
  const row = record(value)
  const offeredListings = array(row.offered_listings).map(record)
  const offeredValue = offeredListings.reduce((sum, item) => sum + number(item.price, 0), 0)
  return {
    kind: 'troc',
    id: String(row.id ?? ''),
    status: text(row.status) || 'pending',
    listingId: String(row.listing_id ?? ''),
    listingTitle: text(row.listing_title) || 'Annonce',
    personName: [text(row.proposer_prenom), text(row.proposer_nom)].filter(Boolean).join(' ') || 'Membre Kalico',
    offeredDescription: text(row.offered_description) || 'Proposition de troc',
    offeredListingTitle: nullableText(offeredListings[0]?.title),
    offeredValueXpf: offeredListings.length ? offeredValue : null,
    requestedValueXpf: nullableNumber(row.listing_price),
    complementXpf: number(row.complement_xpf),
    complementDirection: (text(row.complement_direction) || 'none') as TrocOffer['complementDirection'],
    message: nullableText(row.message),
    createdAt: text(row.created_at) || new Date(0).toISOString(),
    expiresAt: nullableText(row.expires_at),
  }
}

export async function getPersonalListings(session: AccountSession): Promise<PersonalListingsData> {
  if (isDemoSession(session)) {
    const { personalAccountFixture } = await import('@/demo/fixtures/personal-account')
    return personalAccountFixture.listings
  }
  const response = await listingsApi.getMine()
  return {
    listings: array(response.data?.data).map(normalizeListing).filter((item) => item.id),
    capacity: {
      used: number(response.data?.capacity?.used),
      limit: number(response.data?.capacity?.limit, 5),
    },
  }
}

export async function getPersonalFavorites(session: AccountSession): Promise<PersonalFavorite[]> {
  if (isDemoSession(session)) {
    const { personalAccountFixture } = await import('@/demo/fixtures/personal-account')
    return personalAccountFixture.favorites
  }
  const response = await api.get('/users/me/favoris', { params: { limit: 50 } })
  return array(response.data?.data).map(normalizeFavorite).filter((item) => item.id)
}

export async function getPersonalAlerts(session: AccountSession): Promise<SearchAlert[]> {
  if (isDemoSession(session)) {
    const { personalAccountFixture } = await import('@/demo/fixtures/personal-account')
    return personalAccountFixture.alerts
  }
  const response = await api.get('/alerts')
  return array(response.data?.data).map((item) => item as SearchAlert)
}

export async function getPersonalOffers(session: AccountSession): Promise<PersonalOffer[]> {
  if (isDemoSession(session)) {
    const { personalAccountFixture } = await import('@/demo/fixtures/personal-account')
    return personalAccountFixture.offers
  }
  const [priceResponse, trocResponse] = await Promise.all([
    messagesApi.getOffersReceived(),
    trocApi.getProposalsReceived(),
  ])
  return [
    ...array(priceResponse.data?.data).map(normalizePriceOffer),
    ...array(trocResponse.data?.data).map(normalizeTrocOffer),
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

function alertSearchParams(filters: AlertFilters) {
  const params: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value != null && value !== '') params[key] = value
  }
  return { ...params, limit: 5, sort: 'date' }
}

export async function getAlertRecentResults(session: AccountSession, alert: SearchAlert): Promise<AlertRecentResult[]> {
  if (isDemoSession(session)) {
    const { personalAccountFixture } = await import('@/demo/fixtures/personal-account')
    return personalAccountFixture.alertResults[String(alert.id)] ?? []
  }
  const response = await listingsApi.search(alertSearchParams(alert.filters))
  return array(response.data?.data).map((value) => {
    const row = record(value)
    return {
      id: String(row.id ?? ''),
      title: text(row.title ?? row.titre) || 'Annonce',
      price: nullableNumber(row.price ?? row.prix),
      communeName: text(row.commune_name),
      coverImage: nullableText(row.cover_image ?? row.cover_image_thumbnail),
      publishedAt: nullableText(row.published_at ?? row.created_at),
    }
  }).filter((item) => item.id)
}

export const personalAccountActions = {
  markSold: (id: string) => listingsApi.updateStatus(id, { status: 'sold' }),
  renew: (id: string) => listingsApi.renew(id),
  deleteListing: (id: string) => listingsApi.delete(id),
  removeFavorite: (id: string) => api.post(`/listings/${id}/favoris`),
  respondPriceOffer: (id: string, response: 'accepted' | 'declined' | 'countered', counterAmount?: number) =>
    messagesApi.respondToOffer(id, response, counterAmount),
  acceptTroc: (id: string) => trocApi.acceptProposal(id),
  declineTroc: (id: string) => trocApi.declineProposal(id),
  counterTroc: (id: string, description: string) => trocApi.counterProposal(id, {
    offered_description: description,
    offered_listing_ids: [],
    offered_photos: [],
    complement_xpf: 0,
    complement_direction: 'none',
  }),
}
