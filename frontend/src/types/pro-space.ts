export type ProSpaceTimelinePoint = {
  day: string
  label: string
  views: number
  contacts: number
}

export type ProSpaceDashboard = {
  listings: { total: number; active: number; boosted: number; expired: number }
  stats: {
    views_total: number
    views_7d: number
    views_30d: number
    contacts_total: number
    contacts_7d: number
    avg_conversion_rate: number
  }
  timeline_30d: ProSpaceTimelinePoint[]
}

export type ProSpaceProduct = {
  id: number
  title: string
  description: string | null
  price_type: string
  price_xpf: number
  stock_quantity: number | null
  is_available: boolean
  is_active: boolean
  is_featured: boolean
  unit_label: string | null
  cover_image_url: string | null
  catalog_category_name: string | null
  published_listing_count: number
}

export type ProQuoteRequest = {
  id: string
  requesterUserId: number | null
  createdAt: string
  isLockedForFree: boolean
  request: {
    requester_name: string
    requester_email: string
    requester_phone: string
    need_type: string
    commune: string
    budget_xpf: string
    desired_date: string
    details: string
  }
}

export type ProQuoteUnit = 'unit' | 'hour' | 'day' | 'package' | 'meter' | 'square_meter' | 'kilometer'

export type ProQuoteItem = {
  id?: string
  label: string
  description?: string | null
  unit: ProQuoteUnit
  quantity: number
  unit_price_xpf: number
  tgc_rate: number
  subtotal_xpf?: number
  tgc_amount_xpf?: number
  total_xpf?: number
}

export type ProQuoteTemplate = {
  id: number | string
  pro_id: number
  name: string
  subject: string
  client_note: string | null
  items: ProQuoteItem[]
  validity_days: number
  deposit_percent: number
  created_at: string
  updated_at: string
}

export type ProQuote = {
  id: number
  quote_number: string
  requester_name: string
  requester_email: string
  requester_phone: string | null
  commune: string
  subject: string
  items: ProQuoteItem[]
  subtotal_xpf: number
  tgc_amount_xpf: number
  total_xpf: number
  deposit_percent: number
  deposit_amount_xpf: number
  balance_due_xpf: number
  validity_days: number
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'refused' | 'expired' | 'converted' | 'paid'
  valid_until: string | null
  sent_at: string | null
  last_reminded_at: string | null
  reminder_count: number
  paid_at: string | null
  created_at: string
  updated_at: string
}

export type ProBooking = {
  id: number
  requester_name: string
  subject: string
  starts_at: string
  ends_at: string | null
  status: string
  commune: string | null
}

export type ProReview = {
  id: number
  reviewer_prenom: string | null
  rating: number
  title: string | null
  comment: string | null
  verified_purchase: boolean
  reply_content: string | null
  created_at: string
}

export type ProReviewSummary = {
  avg_rating: number
  review_count: number
  verified_count: number
}

export type ProQuoteConfig = {
  tgc_rates: number[]
  units: ProQuoteUnit[]
}

export type ProProfileSummary = {
  id: number
  pro_company_name?: string | null
  pro_description?: string | null
  pro_logo_url?: string | null
  pro_commune?: string | null
  pro_phone?: string | null
  pro_hours?: string | null
}

export type ProSpaceData = {
  dashboard: ProSpaceDashboard
  products: ProSpaceProduct[]
  requests: ProQuoteRequest[]
  quotes: ProQuote[]
  bookings: ProBooking[]
  reviewSummary: ProReviewSummary
  reviews: ProReview[]
  reviewsUnavailable: boolean
  profile: ProProfileSummary | null
  profileUnavailable: boolean
  templates: ProQuoteTemplate[]
  quoteConfig: ProQuoteConfig
}

export type ProQuoteTemplateInput = Omit<ProQuoteTemplate, 'id' | 'pro_id' | 'created_at' | 'updated_at'>

export type ProQuotePreview = {
  subtotalXpf: number
  tgcXpf: number
  totalXpf: number
  depositXpf: number
  balanceXpf: number
}

export type QuoteTrackingColumn = 'requests' | 'sent' | 'accepted' | 'paid'
