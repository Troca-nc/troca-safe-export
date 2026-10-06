import { listingsApi, trocApi } from '@/lib/api'
import { demoOr } from '@/lib/demo'
import type { TrocListing, TrocPageData, TrocProposalInput } from '@/types/troc-page'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {}
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map(asText).filter(Boolean)
  if (typeof value === 'string') return value.split(/[,;|\n]+/).map((item) => item.trim()).filter(Boolean)
  return []
}

function unwrapRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const payload = asRecord(value)
  if (Array.isArray(payload.data)) return payload.data
  const nested = asRecord(payload.data)
  if (Array.isArray(nested.data)) return nested.data
  if (Array.isArray(payload.rows)) return payload.rows
  if (Array.isArray(payload.items)) return payload.items
  return []
}

function normalizeTrocListing(value: unknown): TrocListing | null {
  const item = asRecord(value)
  const id = asText(item.id) || (typeof item.id === 'number' ? String(item.id) : '')
  const title = asText(item.title) || asText(item.titre)
  if (!id || !title) return null

  const compatibility = asRecord(item.compatibility)
  const seller = [asText(item.seller_prenom), asText(item.seller_nom)].filter(Boolean).join(' ')
  const wants = asStringArray(item.troc_wants ?? item.wants)

  return {
    id,
    title,
    valueXpf: asNumber(item.price ?? item.prix ?? item.price_xpf),
    sellerName: seller || asText(item.seller_name) || 'Membre Kalico',
    commune: asText(item.commune_name) || 'Nouvelle-Calédonie',
    condition: asText(item.condition) || 'État non précisé',
    category: asText(item.category_name) || 'Autres',
    categorySlug: asText(item.category_slug) || 'autres',
    wants,
    wish: asText(item.contre_quoi) || wants.join(', ') || 'Ouvert aux propositions.',
    acceptsComplement: Boolean(item.troc_accepts_complement_xpf),
    complementMaxXpf: asNumber(item.troc_complement_max_xpf),
    compatibilityScore: compatibility.score === undefined ? null : asNumber(compatibility.score),
    coverImage: asText(item.cover_image_thumbnail ?? item.cover_image) || null,
  }
}

function normalizedRows(value: unknown) {
  return unwrapRows(value).map(normalizeTrocListing).filter((item): item is TrocListing => Boolean(item))
}

export async function getTrocPageData(includeMine: boolean): Promise<TrocPageData> {
  return demoOr(
    async () => (await import('@/demo/fixtures/troc')).demoTrocPage,
    async () => {
      const [feedResponse, mineResponse] = await Promise.all([
        trocApi.list({ limit: 30 }),
        includeMine ? listingsApi.getMine() : Promise.resolve(null),
      ])
      const payload = asRecord(feedResponse.data)
      const pagination = asRecord(payload.pagination)
      return {
        listings: normalizedRows(feedResponse.data),
        myListings: mineResponse
          ? normalizedRows(mineResponse.data).filter((listing) => listing.valueXpf > 0)
          : [],
        total: asNumber(pagination.total) || normalizedRows(feedResponse.data).length,
      }
    },
  )
}

export async function sendTrocProposal(input: TrocProposalInput) {
  return trocApi.sendProposal(input.targetListingId, {
    offered_listing_ids: [input.offeredListingId],
    offered_description: null,
    offered_photos: [],
    complement_xpf: input.complementXpf,
    complement_direction: input.complementDirection,
    message: input.message?.trim() || null,
  })
}
