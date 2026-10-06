import type { SearchAlert } from '@/types/alert.types'

export type PersonalListingStatus = 'active' | 'pending' | 'reserved' | 'sold' | 'expired' | 'completed'

export type PersonalListing = {
  id: string
  title: string
  price: number | null
  status: PersonalListingStatus
  categoryName: string
  communeName: string
  coverImage: string | null
  views: number
  favorites: number
  messages: number
  publishedAt: string | null
  expiresAt: string | null
  isTroc: boolean
}

export type PersonalListingsData = {
  listings: PersonalListing[]
  capacity: { used: number; limit: number }
}

export type PersonalFavorite = {
  id: string
  title: string
  price: number | null
  status: string
  categoryName: string
  communeName: string
  coverImage: string | null
  savedAt: string | null
  priceDropXpf: number | null
}

export type PriceOffer = {
  kind: 'price'
  id: string
  status: string
  listingId: string
  listingTitle: string
  listingImage: string | null
  personName: string
  personAvatarUrl: string | null
  rating: number | null
  offeredXpf: number
  askingXpf: number | null
  createdAt: string
  expiresAt: string | null
}

export type TrocOffer = {
  kind: 'troc'
  id: string
  status: string
  listingId: string
  listingTitle: string
  personName: string
  offeredDescription: string
  offeredListingTitle: string | null
  offeredValueXpf: number | null
  requestedValueXpf: number | null
  complementXpf: number
  complementDirection: 'none' | 'i_pay' | 'they_pay'
  message: string | null
  createdAt: string
  expiresAt: string | null
}

export type PersonalOffer = PriceOffer | TrocOffer

export type AlertRecentResult = {
  id: string
  title: string
  price: number | null
  communeName: string
  coverImage: string | null
  publishedAt: string | null
}

export type PersonalAccountFixture = {
  listings: PersonalListingsData
  favorites: PersonalFavorite[]
  alerts: SearchAlert[]
  alertResults: Record<string, AlertRecentResult[]>
  offers: PersonalOffer[]
}

export type PersonalAlertMatchLoader = (alert: SearchAlert) => Promise<AlertRecentResult[]>
