import type { CategoryNode } from '@/lib/categoryCatalog'

export type ListingSearchItem = {
  id: string
  type?: string
  title: string
  price: number | null
  price_negotiable: boolean
  is_free: boolean
  condition?: string
  is_featured: boolean
  is_urgent: boolean
  published_at?: string
  created_at?: string
  boosted_until?: string | null
  contre_quoi?: string | null
  is_troc?: boolean
  commune_id?: string | null
  province_id?: string | null
  commune_name?: string
  category_name?: string
  category_slug?: string
  category_icon?: string
  cover_image?: string
  distance_km?: number | null
  metadata?: Record<string, unknown>
  user_rating?: number
  seller_trust_score?: number
  seller_email_verified?: boolean
  seller_phone_verified?: boolean
  is_pro?: boolean
  seller_is_pro?: boolean
  seller_pro_verified?: boolean
  seller_prenom?: string | null
  seller_nom?: string | null
  seller_avatar?: string | null
  author?: { is_pro?: boolean; pro_verified?: boolean } | null
  seller_is_online?: boolean
  seller_last_seen_label?: string | null
  seller_avg_response_time_label?: string | null
  seller_note_moyenne?: number | null
  seller_nb_avis?: number | null
}

export type ListingSearchParams = {
  q?: string
  category?: string
  commune_id?: string
  province_id?: string
  quartier_zone?: string
  price_min?: string
  price_max?: string
  condition?: string
  troc?: string
  lat?: string
  lng?: string
  radius?: number
  sort?: string
  page?: number
  limit?: number
}

export type ListingsPageResult = {
  data: ListingSearchItem[]
  nextCursor: string | null
  pagination: {
    total: number
    page: number
    pages: number
    limit: number
  }
}

export type ListingCommune = {
  id: string
  name: string
  slug: string
}

export type ListingProvince = {
  id: string
  name: string
  code: string
  communes: ListingCommune[]
}

export type ListingsMetadata = {
  categories: CategoryNode[]
  provinces: ListingProvince[]
}

export type ListingDetailImage = {
  id: string
  url: string
  thumbnail_url?: string | null
  medium_url?: string | null
}

export type ListingSeller = {
  id: string
  first_name: string
  last_name: string
  avatar_url?: string | null
  is_pro: boolean
  pro_verified: boolean
  rating?: number | null
  reviews_count?: number | null
  listings_count?: number | null
  member_since?: string | null
  commune_name?: string | null
  province_name?: string | null
  email_verified: boolean
  phone_verified: boolean
  trust_score?: number | null
  is_online: boolean
  last_seen_label?: string | null
  response_time_label?: string | null
}

export type ListingReview = {
  id: string
  rating: number
  comment?: string | null
  created_at?: string
  author_name: string
  author_avatar?: string | null
}

export type ListingDetail = {
  id: string
  title: string
  price: number | null
  price_negotiable: boolean
  is_free: boolean
  description: string
  condition: string
  status: string
  is_featured: boolean
  is_urgent: boolean
  views_count: number
  favorites_count: number
  commune_id?: string | null
  commune_name?: string | null
  commune_slug?: string | null
  category_id?: string | null
  category_name?: string | null
  category_slug?: string | null
  category_icon?: string | null
  published_at?: string
  created_at?: string
  updated_at?: string
  contre_quoi?: string | null
  is_troc: boolean
  metadata: Record<string, unknown>
  images: ListingDetailImage[]
  seller: ListingSeller
  is_favorited: boolean
}
