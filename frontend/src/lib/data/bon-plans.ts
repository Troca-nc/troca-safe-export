import { bonPlansApi, eventsApi } from '@/lib/api'
import { isExpiredBonPlan, isPastEvent } from '@/lib/bonPlansDate'
import { demoOr } from '@/lib/demo'
import type { BonPlan, BonPlanBusiness, BonsPlansPageData, LocalEvent } from '@/types/bon-plans'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {}
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getInitials(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase('fr-FR'))
    .join('')
  return initials || 'K'
}

function extractRows(value: unknown) {
  if (Array.isArray(value)) return value
  const record = asRecord(value)
  if (Array.isArray(record.data)) return record.data
  if (Array.isArray(record.items)) return record.items
  if (Array.isArray(record.events)) return record.events
  return []
}

function normalizeBonPlan(value: unknown): BonPlan | null {
  const item = asRecord(value)
  const id = asText(item.id) || (typeof item.id === 'number' ? String(item.id) : '')
  const title = asText(item.title)
  if (!id || !title) return null

  const businessName = asText(item.business_name ?? item.author_business_name ?? item.author_name) || 'Commerce local'
  const originalPriceXpf = asOptionalNumber(item.original_price_xpf ?? item.normal_price_xpf ?? item.price_xpf)
  const promoPriceXpf = asOptionalNumber(item.promo_price_xpf)
  const explicitDiscount = asOptionalNumber(item.discount_pct)
  const calculatedDiscount = originalPriceXpf && promoPriceXpf !== null && promoPriceXpf < originalPriceXpf
    ? Math.round((1 - promoPriceXpf / originalPriceXpf) * 100)
    : null

  return {
    id,
    title,
    description: asText(item.description),
    businessName,
    businessSlug: asText(item.business_slug) || null,
    businessInitials: getInitials(businessName),
    businessLogoUrl: asText(item.business_logo_url ?? item.author_avatar) || null,
    verified: Boolean(item.business_verified ?? item.author_is_pro ?? item.author_pro_verified),
    category: asText(item.category_name ?? item.category) || 'Autres',
    commune: asText(item.commune_name ?? item.location_name) || null,
    imageUrl: asText(item.image_url ?? item.cover_image ?? (Array.isArray(item.photos) ? item.photos[0] : '')) || null,
    originalPriceXpf,
    promoPriceXpf,
    discountPercent: explicitDiscount ?? calculatedDiscount,
    publishedUntil: asText(item.published_until ?? item.expires_at ?? item.promo_valid_until) || null,
    ctaLabel: asText(item.cta_label) || 'Voir l’offre',
    ctaUrl: asText(item.cta_url ?? item.link_url ?? item.website_url) || null,
  }
}

function normalizeBusiness(value: unknown): BonPlanBusiness | null {
  const item = asRecord(value)
  const name = asText(item.name ?? item.business_name)
  if (!name) return null
  return {
    name,
    slug: asText(item.slug ?? item.business_slug) || null,
    logoUrl: asText(item.business_logo_url ?? item.logo_url) || null,
    badge: asText(item.business_badge ?? item.badge) || null,
  }
}

function normalizeEvent(value: unknown): LocalEvent | null {
  const item = asRecord(value)
  const id = asText(item.id) || (typeof item.id === 'number' ? String(item.id) : '')
  const title = asText(item.title)
  const dateIso = asText(item.event_date ?? item.start_at ?? item.date)
  if (!id || !title || !dateIso) return null

  return {
    id,
    title,
    description: asText(item.description),
    dateIso,
    time: asText(item.event_time ?? item.time) || null,
    endTime: asText(item.end_time) || null,
    commune: asText(item.commune_name) || null,
    venue: asText(item.venue_name ?? item.location_name ?? item.venue) || null,
    category: asText(item.category_name ?? item.category) || 'Autres',
    organizerName: asText(item.organizer_name ?? item.business_name ?? item.author_name) || null,
    verified: Boolean(item.organizer_verified ?? item.author_is_pro ?? item.author_pro_verified),
    isFree: Boolean(item.is_free) || Number(item.price_xpf) === 0,
    priceXpf: asOptionalNumber(item.price_xpf ?? item.price),
    bookingUrl: asText(item.booking_url ?? item.ticketing_url ?? item.link_url ?? item.website_url) || null,
    coverImageUrl: asText(item.cover_image_url ?? item.cover_image ?? (Array.isArray(item.photos) ? item.photos[0] : '')) || null,
  }
}

export async function getBonsPlansPageData(): Promise<BonsPlansPageData> {
  return demoOr(
    async () => (await import('@/demo/fixtures/bon-plans')).bonsPlansPageFixture,
    async () => {
      const [promotionsResponse, businessesResponse, eventsResponse] = await Promise.all([
        bonPlansApi.list({ limit: 36, kind: 'promo' }),
        bonPlansApi.businesses(),
        eventsApi.list({ limit: 100 }),
      ])

      const promotions = extractRows(promotionsResponse.data)
        .map(normalizeBonPlan)
        .filter((item): item is BonPlan => Boolean(item) && !isExpiredBonPlan(item.publishedUntil))
      const businesses = extractRows(businessesResponse.data)
        .map(normalizeBusiness)
        .filter((item): item is BonPlanBusiness => Boolean(item))
      const events = extractRows(eventsResponse.data)
        .map(normalizeEvent)
        .filter((item): item is LocalEvent => Boolean(item) && !isPastEvent(item.dateIso))
        .sort((left, right) => left.dateIso.localeCompare(right.dateIso))

      return { promotions, businesses, events }
    },
  )
}

export async function followBonPlanBusiness(businessName: string) {
  return demoOr(
    async () => undefined,
    async () => {
      const current = await bonPlansApi.getPrefs().catch(() => ({ data: { data: {} } }))
      const preferences = asRecord(current.data?.data)
      const existing = Array.isArray(preferences.notify_businesses)
        ? preferences.notify_businesses.filter((value): value is string => typeof value === 'string')
        : []
      await bonPlansApi.savePrefs({
        ...preferences,
        notify_all: true,
        notify_businesses: Array.from(new Set([...existing, businessName])),
        via_push: true,
      })
    },
  )
}
