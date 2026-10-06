export type BonsPlansTab = 'promos' | 'events'

export type BonPlan = {
  id: string
  title: string
  description: string
  businessName: string
  businessSlug: string | null
  businessInitials: string
  businessLogoUrl: string | null
  verified: boolean
  category: string
  commune: string | null
  imageUrl: string | null
  originalPriceXpf: number | null
  promoPriceXpf: number | null
  discountPercent: number | null
  publishedUntil: string | null
  ctaLabel: string
  ctaUrl: string | null
}

export type BonPlanBusiness = {
  name: string
  slug: string | null
  logoUrl: string | null
  badge: string | null
}

export type LocalEvent = {
  id: string
  title: string
  description: string
  dateIso: string
  time: string | null
  endTime: string | null
  commune: string | null
  venue: string | null
  category: string
  organizerName: string | null
  verified: boolean
  isFree: boolean
  priceXpf: number | null
  bookingUrl: string | null
  coverImageUrl: string | null
}

export type BonsPlansPageData = {
  promotions: BonPlan[]
  businesses: BonPlanBusiness[]
  events: LocalEvent[]
}
