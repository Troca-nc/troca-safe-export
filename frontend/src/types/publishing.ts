export type PublishingKind = 'sale' | 'troc' | 'bonplan' | 'carpool' | 'event'

export type PublishingCategory = {
  id: number
  name: string
  slug: string
}

export type PublishingCommune = {
  id: number
  name: string
  slug?: string
  provinceName?: string | null
}

export type PublishingMetadata = {
  categories: PublishingCategory[]
  communes: PublishingCommune[]
}

export type PublishingDraft = {
  kind: PublishingKind | null
  step: number
  title: string
  description: string
  categoryId: string
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'for_parts'
  priceXpf: string
  negotiable: boolean
  communeId: string
  quartier: string
  handoffModes: string[]
  trocWants: string[]
  trocWish: string
  trocComplementXpf: string
  businessName: string
  bonPlanCategory: string
  discountMode: 'percentage' | 'strikethrough' | 'gift'
  discountPercent: string
  originalPriceXpf: string
  promoPriceXpf: string
  giftDescription: string
  promoCode: string
  validFrom: string
  validUntil: string
  conditions: string
  channel: 'store' | 'online' | 'both'
  address: string
  websiteUrl: string
  durationDays: '7' | '30'
  contactEmail: string
  contactName: string
  contactPhone: string
  departure: string
  destination: string
  departureCommuneId: string
  destinationCommuneId: string
  stops: string
  frequency: 'once' | 'weekly'
  rideDate: string
  rideTime: string
  recurrenceDays: number[]
  seats: string
  luggage: 'Petit sac' | 'Valise' | 'Volumineux'
  musicAllowed: boolean
  noSmoking: boolean
  animalsAllowed: boolean
  womenOnly: boolean
  vehicle: string
  comfort: string
  instantBooking: boolean
  eventCategory: string
  organizerName: string
  eventDate: string
  eventTime: string
  eventEndTime: string
  venueName: string
  venueAddress: string
  eventAccess: 'free' | 'paid' | 'registration'
  bookingUrl: string
  capacity: string
}

export type PublishingResult = {
  id: string
  kind: PublishingKind
  href: string
  paymentUrl?: string | null
  message: string
  demo?: boolean
}

export type PublishingPhoto = {
  id: string
  file: File
  preview: string
}
