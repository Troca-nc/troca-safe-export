export type DealOfferType = '' | 'price' | 'percent' | 'code' | 'multi'
export type DealPlaceMode = 'shop' | 'online' | 'both'
export type DealPaymentProvider = 'stripe' | 'payplug'
export type DealDurationDays = 7 | 30

export type DealPublishDraft = {
  title: string
  originalPriceXpf: string
  promoPriceXpf: string
  discountPercent: string
  promoCode: string
  specialDetail: string
  category: string
  description: string
  imageUrl: string
  validFrom: string
  validUntil: string
  locationName: string
  communeId: string
  offerUrl: string
  businessName: string
  businessLogoUrl: string
  contactEmail: string
  catalogPdfUrl: string
}

export type StoredDealDraft = {
  form: DealPublishDraft
  offerType: DealOfferType
  placeMode: DealPlaceMode
  durationDays: DealDurationDays
  paymentProvider: DealPaymentProvider
  savedAt: string
}

export type DealCommuneOption = { id: number; name: string }
export type DealPublishMetadata = { communes: DealCommuneOption[] }

export type DealPublishResult = {
  id: string
  checkoutUrl: string | null
  success: boolean
  message: string | null
}
