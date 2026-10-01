export type HomeListing = {
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
  commune_name?: string
  category_name?: string
  category_slug?: string
  category_icon?: string
  cover_image?: string
  distance_km?: number | null
  seller_prenom?: string | null
  seller_nom?: string | null
  seller_avatar?: string | null
  seller_note_moyenne?: number | null
  seller_nb_avis?: number | null
  seller_pro_verified?: boolean
  seller_email_verified?: boolean
  seller_phone_verified?: boolean
  is_pro?: boolean
}

export type HomePro = {
  id: string
  displayName: string
  category: string | null
  commune: string | null
  description: string | null
  rating: number
  reviewCount: number
  logoUrl: string | null
}

export type HomeCategory = {
  name: string
  slug: string
  initial: string
  hint: string
}

export type HomeCommune = {
  name: string
  slug: string
}

export type HomeNavigation = {
  categories: HomeCategory[]
  communes: HomeCommune[]
}
