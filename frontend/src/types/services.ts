import type { Ride } from '@/types/covoiturage'

export type ServicesTab = 'devis' | 'pros' | 'envoi'

export type ServiceCategory = {
  slug: string
  name: string
}

export type ServiceCommune = {
  id: number
  name: string
  slug: string
  provinceName: string
}

export type ServicePro = {
  id: number
  name: string
  category: string
  commune: string
  description: string
  logoUrl: string | null
  rating: number
  reviewCount: number
  listingCount: number
  verified: boolean
}

export type QuoteOffer = {
  id: number
  proName: string
  proRating: number
  amountXpf: number
  delayDays: number
  message: string | null
  status: string
}

export type QuoteRequest = {
  id: number
  categorySlug: string
  categoryName: string
  commune: string
  title: string
  description: string
  budgetMinXpf: number | null
  budgetMaxXpf: number | null
  desiredDate: string | null
  status: string
  createdAt: string
  offerCount: number
  offers: QuoteOffer[]
}

export type QuoteDraft = {
  categorySlug: string
  commune: string
  title: string
  description: string
  budgetMaxXpf: string
  desiredDate: string
  contactEmail: string
  contactPhone: string
}

export type ShippingSize = 'small' | 'medium' | 'large' | 'oversize'

export type ShippingEstimate = {
  estimatedMinXpf: number | null
  estimatedMaxXpf: number | null
  distanceKm: number | null
  volumeLabel: string
  weightLabel: string
  summary: string
}

export type ShippingOffer = {
  id: number
  amountXpf: number
  pickupDate: string
  pickupSlot: string
  status: string
  transporterName: string
  transporterRating: number
  transporterVerified: boolean
}

export type ShippingRequest = {
  id: number
  departure: string
  destination: string
  cargoType: string
  status: string
  statusLabel: string
  offersCount: number
  offers: ShippingOffer[]
  selectedOfferId: number | null
  estimatedMinXpf: number | null
  estimatedMaxXpf: number | null
}

export type ShippingDraft = {
  departureCommuneId: string
  destinationCommuneId: string
  size: ShippingSize
  cargoType: string
  description: string
  urgency: 'h24' | 'week' | 'flexible'
  contactEmail: string
  contactPhone: string
  fragile: boolean
}

export type ServicesCatalog = {
  categories: ServiceCategory[]
  communes: ServiceCommune[]
  pros: ServicePro[]
}

export type RouteMember = Ride
