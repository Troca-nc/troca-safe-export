import { bonPlansApi, metaApi } from '@/lib/api'
import type {
  DealDurationDays,
  DealOfferType,
  DealPlaceMode,
  DealPublishDraft,
  DealPublishMetadata,
  DealPublishResult,
  StoredDealDraft,
} from '@/types/deals'

export const DEAL_CATEGORIES = [
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'mode', label: 'Mode' },
  { value: 'beaute', label: 'Beauté' },
  { value: 'high_tech', label: 'High-tech' },
  { value: 'auto_moto', label: 'Auto / Moto' },
  { value: 'maison', label: 'Maison' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'services', label: 'Services' },
  { value: 'sport', label: 'Sport' },
  { value: 'voyages', label: 'Voyages' },
  { value: 'autre', label: 'Autre' },
] as const

export function createDealPublishDraft(profile?: { name?: string; email?: string }): DealPublishDraft {
  return {
    title: '',
    originalPriceXpf: '',
    promoPriceXpf: '',
    discountPercent: '',
    promoCode: '',
    specialDetail: '',
    category: '',
    description: '',
    imageUrl: '',
    validFrom: '',
    validUntil: '',
    locationName: '',
    communeId: '',
    offerUrl: '',
    businessName: profile?.name || '',
    businessLogoUrl: '',
    contactEmail: profile?.email || '',
    catalogPdfUrl: '',
  }
}

export function computeDiscountPercent(beforeValue: string, afterValue: string) {
  const before = Number(beforeValue)
  const after = Number(afterValue)
  if (!Number.isFinite(before) || !Number.isFinite(after) || before <= 0 || after < 0 || after >= before) return null
  return Math.round((1 - after / before) * 100)
}

function asCommunes(value: unknown): DealPublishMetadata['communes'] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const nested = Array.isArray(row.communes) ? row.communes : [row]
    return nested.flatMap((commune) => {
      if (!commune || typeof commune !== 'object') return []
      const data = commune as Record<string, unknown>
      const id = Number(data.id)
      const name = String(data.name ?? data.nom ?? data.libelle ?? '').trim()
      return Number.isFinite(id) && name ? [{ id, name }] : []
    })
  })
}

export async function getDealPublishMetadata(): Promise<DealPublishMetadata> {
  const response = await metaApi.getCommunes()
  return { communes: asCommunes(response.data?.data) }
}

export function dealDraftStorageKey(userId?: string | null) {
  return `kalico:deal-publish-draft:${userId || 'visitor'}`
}

export function loadLocalDealDraft(userId?: string | null): StoredDealDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(dealDraftStorageKey(userId))
    return raw ? JSON.parse(raw) as StoredDealDraft : null
  } catch {
    return null
  }
}

export function saveLocalDealDraft(userId: string | null | undefined, draft: StoredDealDraft) {
  if (typeof window !== 'undefined') window.localStorage.setItem(dealDraftStorageKey(userId), JSON.stringify(draft))
}

export function clearLocalDealDraft(userId?: string | null) {
  if (typeof window !== 'undefined') window.localStorage.removeItem(dealDraftStorageKey(userId))
}

function integer(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function generatedDescription(form: DealPublishDraft, offerType: DealOfferType) {
  if (form.description.trim()) return form.description.trim()
  if (offerType === 'multi') return `Offre spéciale : ${form.specialDetail.trim()}.`
  if (offerType === 'code') return `Offre disponible avec le code ${form.promoCode.trim().toUpperCase()}.`
  if (offerType === 'percent') return `Remise de ${integer(form.discountPercent)} % proposée par ${form.businessName.trim()}.`
  return `Prix réduit proposé par ${form.businessName.trim()}.`
}

function promoLabel(form: DealPublishDraft, offerType: DealOfferType) {
  if (offerType === 'price') {
    const discount = computeDiscountPercent(form.originalPriceXpf, form.promoPriceXpf)
    return discount ? `−${discount} %` : null
  }
  if (offerType === 'percent') return `−${integer(form.discountPercent)} %`
  if (offerType === 'code') return `CODE ${form.promoCode.trim().toUpperCase()}`.slice(0, 80)
  return form.specialDetail.trim().slice(0, 80) || 'OFFRE'
}

export function buildDealPayload(
  form: DealPublishDraft,
  offerType: DealOfferType,
  placeMode: DealPlaceMode,
  durationDays: DealDurationDays,
) {
  const hasShop = placeMode !== 'online'
  const hasOnline = placeMode !== 'shop'
  return {
    business_name: form.businessName.trim(),
    business_logo_url: form.businessLogoUrl.trim() || null,
    catalog_pdf_url: form.catalogPdfUrl.trim() || null,
    title: form.title.trim(),
    description: generatedDescription(form, offerType),
    image_url: form.imageUrl.trim() || null,
    promo_label: promoLabel(form, offerType),
    original_price_xpf: offerType === 'price' ? integer(form.originalPriceXpf) : null,
    promo_price_xpf: offerType === 'price' ? integer(form.promoPriceXpf) : null,
    cta_label: placeMode === 'online' ? 'Voir l’offre' : 'En profiter',
    cta_url: hasOnline ? form.offerUrl.trim() || null : null,
    category: form.category,
    promo_valid_from: form.validFrom || null,
    promo_valid_until: form.validUntil,
    commune_id: hasShop ? Number(form.communeId) : null,
    location_name: hasShop ? form.locationName.trim() : null,
    conditions: offerType === 'code'
      ? [`Code : ${form.promoCode.trim().toUpperCase()}`, form.description.trim()].filter(Boolean).join(' · ')
      : form.description.trim() || null,
    kind: 'promo',
    duration_days: durationDays,
    contact_email: form.contactEmail.trim(),
  }
}

export async function publishDeal(
  form: DealPublishDraft,
  offerType: DealOfferType,
  placeMode: DealPlaceMode,
  durationDays: DealDurationDays,
): Promise<DealPublishResult> {
  const response = await bonPlansApi.create(buildDealPayload(form, offerType, placeMode, durationDays))
  const data = response.data?.data
  const id = String(data?.id ?? '')
  if (!id) throw new Error('Le serveur n’a pas retourné l’identifiant du bon plan.')
  return {
    id,
    success: Boolean(data?.success),
    message: data?.message || null,
  }
}
