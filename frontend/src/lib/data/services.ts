import { deliveryApi, metaApi, proApi, quoteRequestsApi } from '@/lib/api'
import { getRides } from '@/lib/data/covoiturage'
import { demoOr } from '@/lib/demo'
import type {
  QuoteDraft,
  QuoteOffer,
  QuoteRequest,
  RouteMember,
  ServiceCategory,
  ServiceCommune,
  ServicePro,
  ServicesCatalog,
  ShippingDraft,
  ShippingEstimate,
  ShippingOffer,
  ShippingRequest,
  ShippingSize,
} from '@/types/services'

type UnknownRecord = Record<string, unknown>

const record = (value: unknown): UnknownRecord => value && typeof value === 'object' ? value as UnknownRecord : {}
const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const number = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const optionalNumber = (value: unknown) => value === null || value === undefined || value === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null
const array = (value: unknown) => Array.isArray(value) ? value : []

function categoryNodes(value: unknown): UnknownRecord[] {
  const root = array(value).map(record)
  return root.flatMap((node) => [node, ...categoryNodes(node.children)])
}

function normalizeCategories(value: unknown): ServiceCategory[] {
  const roots = array(value).map(record)
  const servicesRoot = roots.find((node) => text(node.slug) === 'services')
  const candidates = servicesRoot && array(servicesRoot.children).length ? array(servicesRoot.children).map(record) : categoryNodes(roots)
  const seen = new Set<string>()
  return candidates.flatMap((node) => {
    const slug = text(node.slug)
    const name = text(node.name)
    if (!slug || !name || slug === 'services' || seen.has(slug)) return []
    seen.add(slug)
    return [{ slug, name }]
  })
}

function normalizeCommunes(value: unknown): ServiceCommune[] {
  return array(value).flatMap((provinceValue) => {
    const province = record(provinceValue)
    const nested = array(province.communes)
    const values = nested.length ? nested : [provinceValue]
    return values.flatMap((communeValue) => {
      const commune = record(communeValue)
      const id = number(commune.id)
      const name = text(commune.name)
      const slug = text(commune.slug)
      if (!id || !name || !slug) return []
      return [{ id, name, slug, provinceName: text(province.name ?? commune.province_name) }]
    })
  }).sort((left, right) => left.name.localeCompare(right.name, 'fr-FR'))
}

function normalizePro(value: unknown): ServicePro | null {
  const item = record(value)
  const id = number(item.id)
  const name = text(item.pro_company_name) || [text(item.prenom), text(item.nom)].filter(Boolean).join(' ')
  if (!id || !name) return null
  return {
    id,
    name,
    category: text(item.pro_category) || 'Service local',
    commune: text(item.pro_commune) || 'Nouvelle-Calédonie',
    description: text(item.pro_description),
    logoUrl: text(item.pro_logo_url) || null,
    rating: number(item.avg_rating ?? item.note_moyenne),
    reviewCount: number(item.review_count ?? item.nb_avis),
    listingCount: number(item.listing_count),
    verified: item.pro_verified !== false,
  }
}

function normalizeQuoteOffer(value: unknown): QuoteOffer | null {
  const item = record(value)
  const id = number(item.id)
  if (!id) return null
  return {
    id,
    proName: text(item.pro_name) || 'Professionnel local',
    proRating: number(item.pro_rating),
    amountXpf: number(item.amount_xpf),
    delayDays: number(item.delay_days),
    message: text(item.message) || null,
    status: text(item.status),
  }
}

function normalizeQuoteRequest(value: unknown): QuoteRequest | null {
  const item = record(value)
  const id = number(item.id)
  if (!id) return null
  const offers = array(item.offers).map(normalizeQuoteOffer).filter((offer): offer is QuoteOffer => Boolean(offer))
  return {
    id,
    categorySlug: text(item.category_slug),
    categoryName: text(item.category_name) || text(item.category_slug),
    commune: text(item.commune),
    title: text(item.title),
    description: text(item.description),
    budgetMinXpf: optionalNumber(item.budget_min_xpf),
    budgetMaxXpf: optionalNumber(item.budget_max_xpf),
    desiredDate: text(item.desired_date) || null,
    status: text(item.status),
    createdAt: text(item.created_at),
    offerCount: number(item.offers_count ?? item.offer_count, offers.length),
    offers,
  }
}

function normalizeShippingOffer(value: unknown): ShippingOffer | null {
  const item = record(value)
  const transporter = record(item.transporter)
  const id = number(item.id)
  if (!id) return null
  return {
    id,
    amountXpf: number(item.amount_xpf),
    pickupDate: text(item.pickup_date),
    pickupSlot: text(item.pickup_slot_label ?? item.pickup_slot),
    status: text(item.status),
    transporterName: text(transporter.display_name ?? transporter.company_name) || 'Transporteur local',
    transporterRating: number(transporter.rating),
    transporterVerified: Boolean(transporter.is_verified),
  }
}

function normalizeShippingRequest(value: unknown): ShippingRequest | null {
  const item = record(value)
  const departure = record(item.departure_commune)
  const destination = record(item.destination_commune)
  const id = number(item.id)
  if (!id) return null
  const offers = array(item.offers).map(normalizeShippingOffer).filter((offer): offer is ShippingOffer => Boolean(offer))
  return {
    id,
    departure: text(departure.name ?? item.departure),
    destination: text(destination.name ?? item.destination),
    cargoType: text(item.cargo_type) || 'Colis',
    status: text(item.status),
    statusLabel: text(item.status_label) || text(item.status),
    offersCount: number(item.offers_count, offers.length),
    offers,
    selectedOfferId: optionalNumber(item.selected_offer_id),
    estimatedMinXpf: optionalNumber(item.estimated_min_xpf),
    estimatedMaxXpf: optionalNumber(item.estimated_max_xpf),
  }
}

const sizeBuckets: Record<ShippingSize, { volume_bucket: string; weight_bucket: string }> = {
  small: { volume_bucket: 'lt_0_5', weight_bucket: 'lt_10' },
  medium: { volume_bucket: 'range_0_5_2', weight_bucket: 'range_10_50' },
  large: { volume_bucket: 'range_2_10', weight_bucket: 'range_50_200' },
  oversize: { volume_bucket: 'gt_10', weight_bucket: 'gt_200' },
}

export async function getServicesCatalog(): Promise<ServicesCatalog> {
  return demoOr(
    async () => (await import('@/demo/fixtures/services')).demoServicesCatalog,
    async () => {
      const [categoriesResponse, communesResponse, prosResponse] = await Promise.all([
        metaApi.getCategories(),
        metaApi.getCommunes(),
        proApi.list({ limit: 100 }),
      ])
      return {
        categories: normalizeCategories(categoriesResponse.data?.data),
        communes: normalizeCommunes(communesResponse.data?.data),
        pros: array(prosResponse.data?.data).map(normalizePro).filter((pro): pro is ServicePro => Boolean(pro)),
      }
    },
  )
}

export async function getQuoteRequests(authenticated: boolean): Promise<QuoteRequest[]> {
  if (!authenticated) return []
  return demoOr(
    async () => (await import('@/demo/fixtures/services')).demoQuoteRequests,
    async () => {
      const response = await quoteRequestsApi.getMine()
      const summaries = array(response.data?.data)
      const detailed = await Promise.all(summaries.slice(0, 4).map(async (summary) => {
        const item = record(summary)
        if (number(item.offer_count) === 0) return summary
        try {
          const detail = await quoteRequestsApi.getById(number(item.id))
          return detail.data?.data ?? summary
        } catch {
          return summary
        }
      }))
      return detailed.map(normalizeQuoteRequest).filter((request): request is QuoteRequest => Boolean(request))
    },
  )
}

export async function createQuoteRequest(draft: QuoteDraft) {
  return demoOr(
    async () => ({ id: 699 }),
    async () => {
      const response = await quoteRequestsApi.create({
        mode: 'open',
        category_slug: draft.categorySlug,
        commune: draft.commune,
        title: draft.title,
        description: draft.description,
        budget_max_xpf: draft.budgetMaxXpf ? Number(draft.budgetMaxXpf) : null,
        desired_date: draft.desiredDate || null,
        contact_email: draft.contactEmail,
        contact_phone: draft.contactPhone || null,
      })
      return response.data?.data ?? response.data
    },
  )
}

export async function selectQuoteOffer(requestId: number, offerId: number) {
  return demoOr(async () => undefined, async () => { await quoteRequestsApi.selectOffer(requestId, { offer_id: offerId }) })
}

export async function estimateShipping(draft: ShippingDraft): Promise<ShippingEstimate | null> {
  if (!draft.departureCommuneId || !draft.destinationCommuneId || draft.departureCommuneId === draft.destinationCommuneId) return null
  return demoOr(
    async () => (await import('@/demo/fixtures/services')).demoShippingEstimate,
    async () => {
      const response = await deliveryApi.estimate({
        departure_commune_id: Number(draft.departureCommuneId),
        destination_commune_id: Number(draft.destinationCommuneId),
        ...sizeBuckets[draft.size],
        urgency: draft.urgency,
      })
      const item = record(response.data?.data)
      return {
        estimatedMinXpf: optionalNumber(item.estimated_min_xpf),
        estimatedMaxXpf: optionalNumber(item.estimated_max_xpf),
        distanceKm: optionalNumber(item.distance_km),
        volumeLabel: text(item.volume_label),
        weightLabel: text(item.weight_label),
        summary: text(item.summary),
      }
    },
  )
}

export async function getRouteMembers(departure: string, destination: string): Promise<RouteMember[]> {
  if (!departure || !destination || departure === destination) return []
  const rides = await getRides({ departure, destination })
  return rides.filter((ride) => ride.departure === departure && ride.destination === destination).slice(0, 3)
}

export async function getShippingRequests(authenticated: boolean): Promise<ShippingRequest[]> {
  if (!authenticated) return []
  return demoOr(
    async () => (await import('@/demo/fixtures/services')).demoShippingRequests,
    async () => {
      const response = await deliveryApi.getMine()
      return array(response.data?.data).map(normalizeShippingRequest).filter((request): request is ShippingRequest => Boolean(request))
    },
  )
}

export async function createShippingRequest(draft: ShippingDraft) {
  return demoOr(
    async () => ({ id: 899 }),
    async () => {
      const response = await deliveryApi.createRequest({
        service_type: 'colis',
        departure_commune_id: Number(draft.departureCommuneId),
        destination_commune_id: Number(draft.destinationCommuneId),
        cargo_type: draft.cargoType,
        ...sizeBuckets[draft.size],
        urgency: draft.urgency,
        description: draft.description,
        contact_email: draft.contactEmail,
        contact_phone: draft.contactPhone || null,
        fragile: draft.fragile,
      })
      return response.data?.data ?? response.data
    },
  )
}

export async function selectShippingOffer(requestId: number, offerId: number) {
  return demoOr(async () => undefined, async () => { await deliveryApi.selectOffer(requestId, offerId) })
}
