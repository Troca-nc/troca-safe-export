export type ProPublicReview = {
  id: number | string
  rating: number
  title?: string | null
  comment?: string | null
  created_at?: string
  reviewer_prenom?: string | null
  reviewer_nom?: string | null
  verified_purchase?: boolean
  helpful_count?: number | null
  reply_content?: string | null
  reply_at?: string | null
  reply_author_name?: string | null
  reviewer_avatar_url?: string | null
}

export type ProPublicBookingSettings = {
  is_enabled: boolean
  title: string
  subtitle: string
  location_label: string
  location_text?: string | null
  instructions?: string | null
  slot_duration_minutes: number
  advance_notice_hours: number
  max_days_ahead: number
  services?: Array<{ title: string; duration_minutes: number; price_xpf?: number | null; description?: string | null; is_active?: boolean }>
  weekly_hours?: Array<{ day_index: number; label?: string | null; is_open?: boolean; start_time?: string | null; end_time?: string | null }>
}

export type ProPublicBookingSlot = { id: number | string; starts_at: string; ends_at: string; label?: string | null; status?: string | null }

export type ProPublicProduct = {
  id: number | string
  title: string
  slug?: string | null
  description?: string | null
  price_type?: 'fixed' | 'from' | 'on_quote' | 'free'
  price_xpf: number
  compare_at_price_xpf?: number | null
  stock_quantity?: number | null
  is_available?: boolean
  is_featured?: boolean
  sku?: string | null
  brand?: string | null
  category_id?: number | null
  category_name?: string | null
  catalog_category_id?: number | null
  catalog_category_name?: string | null
  commune_id?: number | null
  commune_name?: string | null
  unit_label?: string | null
  cover_image_url?: string | null
  image_count?: number
  images?: Array<{ id?: number | string; url: string; position?: number; alt_text?: string | null }>
}

export type ProPublicCatalogCategory = { id: number | string; name: string; slug?: string | null; position?: number | null }

export type ProSummary = {
  id: number
  name: string
  firstName: string
  lastName: string
  companyName: string
  category: string
  commune: string
  description: string
  logoUrl: string | null
  bannerUrl: string | null
  rating: number
  reviewCount: number
  listingCount: number
  latestReview: string | null
  verified: true
  quoteTemplate?: unknown
}

export type ProPublicProfile = {
  id: number | string
  prenom?: string | null
  nom?: string | null
  display_name?: string | null
  pro_company_name?: string | null
  pro_category?: string | null
  pro_logo_url?: string | null
  pro_banner_url?: string | null
  pro_catalog_pdf_url?: string | null
  pro_description?: string | null
  pro_commune?: string | null
  pro_website?: string | null
  pro_phone?: string | null
  pro_hours?: string | null
  pro_portfolio_photos?: string[] | null
  pro_quote_template?: unknown
  pro_verified?: boolean
  avg_rating?: number | null
  review_count?: number | null
  listing_count?: number | null
  product_count?: number | null
  booking_settings?: ProPublicBookingSettings | null
  booking_slots?: ProPublicBookingSlot[]
  products?: ProPublicProduct[]
  catalog_categories?: ProPublicCatalogCategory[]
  reviews?: ProPublicReview[]
  listings?: Array<Record<string, unknown> & { id: number | string }>
}
