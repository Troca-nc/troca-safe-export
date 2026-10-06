import axios from 'axios'

import { bonPlansApi, covoiturageApi, eventsApi, listingsApi, metaApi, uploadApi } from '@/lib/api'
import {
  createDemoPublishingResult,
  EMPTY_PUBLISHING_DRAFT,
  PUBLISHING_DEMO_DRAFTS,
  PUBLISHING_DEMO_METADATA,
} from '@/demo/fixtures/publishing'
import type {
  PublishingCategory,
  PublishingCommune,
  PublishingDraft,
  PublishingMetadata,
  PublishingPhoto,
  PublishingResult,
} from '@/types/publishing'

type RawCategory = {
  id: number
  name: string
  slug: string
  children?: RawCategory[]
  subcategories?: RawCategory[]
}

type RawProvince = {
  name?: string
  communes?: Array<{ id: number; name: string; slug?: string; province_name?: string | null }>
}

function flattenCategories(nodes: RawCategory[]): PublishingCategory[] {
  return nodes.flatMap((node) => {
    const children = node.children ?? node.subcategories ?? []
    if (children.length > 0) return flattenCategories(children)
    return [{ id: Number(node.id), name: node.name, slug: node.slug }]
  })
}

function normalizeCommunes(provinces: RawProvince[]): PublishingCommune[] {
  return provinces.flatMap((province) => (province.communes ?? []).map((commune) => ({
    id: Number(commune.id),
    name: commune.name,
    slug: commune.slug,
    provinceName: commune.province_name ?? province.name ?? null,
  })))
}

function numberOrZero(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed / 10) * 10) : 0
}

function nullableNumber(value: string) {
  return value.trim() ? numberOrZero(value) : null
}

function communeName(metadata: PublishingMetadata, id: string) {
  return metadata.communes.find((commune) => String(commune.id) === id)?.name ?? ''
}

export function getPublishingErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return String(error.response?.data?.error || error.response?.data?.message || error.message || 'La publication a échoué.')
  }
  return error instanceof Error ? error.message : 'La publication a échoué.'
}

export function createPublishingDraft({
  kind = null,
  demoMode,
  email = '',
  name = '',
  phone = '',
}: {
  kind?: PublishingDraft['kind']
  demoMode: boolean
  email?: string
  name?: string
  phone?: string
}): PublishingDraft {
  return {
    ...EMPTY_PUBLISHING_DRAFT,
    ...(kind && demoMode ? PUBLISHING_DEMO_DRAFTS[kind] : {}),
    kind,
    step: 0,
    contactEmail: email,
    contactName: name,
    contactPhone: phone,
    handoffModes: [...EMPTY_PUBLISHING_DRAFT.handoffModes],
    trocWants: kind && demoMode ? [...(PUBLISHING_DEMO_DRAFTS[kind].trocWants ?? [])] : [],
    recurrenceDays: [],
  }
}

export async function loadPublishingMetadata(demoMode: boolean): Promise<PublishingMetadata> {
  if (demoMode) return PUBLISHING_DEMO_METADATA

  const [categoriesResponse, communesResponse] = await Promise.all([
    metaApi.getCategories(),
    metaApi.getCommunes(),
  ])
  const categories = flattenCategories(Array.isArray(categoriesResponse.data?.data) ? categoriesResponse.data.data : [])
  const communes = normalizeCommunes(Array.isArray(communesResponse.data?.data) ? communesResponse.data.data : [])

  if (!categories.length || !communes.length) {
    throw new Error('Les catégories ou les communes sont momentanément indisponibles.')
  }
  return { categories, communes }
}

export async function publishDraft({
  draft,
  metadata,
  photos,
  demoMode,
}: {
  draft: PublishingDraft
  metadata: PublishingMetadata
  photos: PublishingPhoto[]
  demoMode: boolean
}): Promise<PublishingResult> {
  if (!draft.kind) throw new Error('Choisissez un type de publication.')

  if (demoMode) {
    const demo = createDemoPublishingResult(draft.kind)
    return {
      ...demo,
      kind: draft.kind,
      demo: true,
      message: 'Publication de démonstration créée sans écriture serveur.',
    }
  }

  if (draft.kind === 'sale' || draft.kind === 'troc') {
    const isTroc = draft.kind === 'troc'
    const response = await listingsApi.create({
      title: draft.title.trim(),
      description: draft.description.trim(),
      category_id: Number(draft.categoryId),
      commune_id: Number(draft.communeId),
      condition: draft.condition,
      price: numberOrZero(draft.priceXpf),
      is_free: false,
      is_troc: isTroc,
      price_negotiable: isTroc ? false : draft.negotiable,
      is_negotiable: isTroc ? false : draft.negotiable,
      contre_quoi: isTroc ? draft.trocWish.trim() : '',
      troc_wants: isTroc ? draft.trocWants : [],
      troc_accepts_complement_xpf: isTroc && numberOrZero(draft.trocComplementXpf) > 0,
      troc_complement_max_xpf: isTroc ? numberOrZero(draft.trocComplementXpf) : 0,
      duration_days: 30,
      metadata: {
        quartier_zone: draft.quartier.trim() || null,
        handoff_modes: draft.handoffModes,
      },
    })
    const id = String(response.data?.data?.id ?? '')
    if (!id) throw new Error('Le serveur n’a pas retourné l’identifiant de l’annonce.')
    if (photos.length) await uploadApi.uploadImages(id, photos.map((photo) => photo.file))
    return {
      id,
      kind: draft.kind,
      href: `/annonces/${id}`,
      message: isTroc ? 'Votre troc est en ligne.' : 'Votre annonce est en ligne.',
    }
  }

  if (draft.kind === 'bonplan') {
    const promoLabel = draft.discountMode === 'percentage'
      ? `−${numberOrZero(draft.discountPercent)} %`
      : draft.discountMode === 'gift'
        ? draft.giftDescription.trim()
        : null
    const response = await bonPlansApi.create({
      business_name: draft.businessName.trim(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      promo_label: promoLabel,
      original_price_xpf: draft.discountMode === 'strikethrough' ? nullableNumber(draft.originalPriceXpf) : null,
      promo_price_xpf: draft.discountMode === 'strikethrough' ? nullableNumber(draft.promoPriceXpf) : null,
      category: draft.bonPlanCategory,
      promo_valid_from: draft.validFrom || null,
      promo_valid_until: draft.validUntil || null,
      duration_days: Number(draft.durationDays),
      payment_provider: 'stripe',
      contact_email: draft.contactEmail.trim(),
      contact_name: draft.contactName.trim() || null,
      contact_phone: draft.contactPhone.trim() || null,
      website_url: draft.websiteUrl.trim() || null,
      link_url: draft.websiteUrl.trim() || null,
      location_name: draft.channel === 'online' ? null : draft.address.trim(),
      commune_id: draft.channel === 'online' ? null : Number(draft.communeId),
      conditions: [draft.conditions.trim(), draft.promoCode.trim() ? `Code : ${draft.promoCode.trim()}` : ''].filter(Boolean).join(' · ') || null,
      photos: [],
      social_links: {},
      kind: 'promo',
      target_audience: 'pro',
    })
    const data = response.data?.data ?? {}
    const id = String(data.id ?? '')
    if (!id) throw new Error('Le serveur n’a pas retourné l’identifiant du bon plan.')
    return {
      id,
      kind: draft.kind,
      href: '/bons-plans',
      paymentUrl: data.payment_url ?? data.checkout_url ?? null,
      message: data.success ? 'Votre bon plan est publié.' : 'Votre bon plan est prêt. Finalisez le paiement pour l’activer.',
    }
  }

  if (draft.kind === 'carpool') {
    const departureId = draft.departureCommuneId || draft.communeId
    const destinationId = draft.destinationCommuneId
    const response = await covoiturageApi.create({
      departure: draft.departure.trim() || communeName(metadata, departureId),
      destination: draft.destination.trim() || communeName(metadata, destinationId),
      stops: draft.stops.split(',').map((stop) => stop.trim()).filter(Boolean),
      ride_date: draft.rideDate,
      ride_time: draft.rideTime,
      seats_total: Number(draft.seats),
      booking_mode: draft.instantBooking ? 'auto' : 'manual',
      price_xpf: numberOrZero(draft.priceXpf),
      vehicle: draft.vehicle.trim(),
      comfort: draft.comfort.trim() || null,
      luggage_allowed: draft.luggage,
      music_allowed: draft.musicAllowed,
      no_smoking: draft.noSmoking,
      animals_allowed: draft.animalsAllowed,
      women_only: draft.womenOnly,
      description: draft.description.trim(),
      departure_commune_id: Number(departureId) || null,
      destination_commune_id: Number(destinationId) || null,
      recurrence_enabled: draft.frequency === 'weekly',
      recurrence_type: draft.frequency === 'weekly' ? 'weekly' : 'none',
      recurrence_days: draft.frequency === 'weekly' ? draft.recurrenceDays : [],
      recurrence_count: draft.frequency === 'weekly' ? 8 : null,
    })
    const id = String(response.data?.data?.id ?? '')
    if (!id) throw new Error('Le serveur n’a pas retourné l’identifiant du trajet.')
    return { id, kind: draft.kind, href: `/covoiturage/transport/${id}`, message: 'Votre trajet est publié.' }
  }

  const isFree = draft.eventAccess === 'free'
  const response = await eventsApi.create({
    title: draft.title.trim(),
    description: draft.description.trim(),
    venue_name: draft.venueName.trim(),
    venue_address: draft.venueAddress.trim() || null,
    commune_id: Number(draft.communeId),
    event_date: draft.eventDate,
    event_time: draft.eventTime,
    end_time: draft.eventEndTime || null,
    booking_url: draft.bookingUrl.trim() || null,
    price_normal_xpf: isFree ? 0 : numberOrZero(draft.priceXpf),
    price_reduced_xpf: null,
    category: draft.eventCategory,
    status: 'published',
    has_ticketing: false,
    max_capacity: Number(draft.capacity) || null,
    is_free: isFree,
    organizer_name: draft.organizerName.trim(),
    organizer_email: draft.contactEmail.trim() || null,
    organizer_phone: draft.contactPhone.trim() || null,
    target_audience: 'particulier',
    kind: 'event',
    price_xpf: isFree ? 0 : numberOrZero(draft.priceXpf),
    photos: [],
  })
  const id = String(response.data?.data?.id ?? '')
  if (!id) throw new Error('Le serveur n’a pas retourné l’identifiant de l’événement.')
  return { id, kind: draft.kind, href: `/evenements/${id}`, message: 'Votre événement est publié.' }
}
