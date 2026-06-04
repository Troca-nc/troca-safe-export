import { cache } from 'react'

import { SITE_URL } from '@/types/seo.types'

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

export type ProPublicProfile = {
  id: number | string
  prenom?: string | null
  nom?: string | null
  display_name?: string | null
  pro_company_name?: string | null
  pro_category?: string | null
  pro_logo_url?: string | null
  pro_banner_url?: string | null
  pro_description?: string | null
  pro_commune?: string | null
  pro_website?: string | null
  pro_phone?: string | null
  pro_hours?: string | null
  pro_quote_template?: unknown
  avg_rating?: number | null
  review_count?: number | null
  listing_count?: number | null
  reviews?: ProPublicReview[]
  listings?: any[]
}

type ApiResponse<T> = {
  data?: T
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? `${SITE_URL}/api`).replace(/\/$/, '')

export const fetchProPublicProfile = cache(async (id: string) => {
  try {
    const res = await fetch(`${API_BASE}/pro/${id}`, {
      next: { revalidate: 300 },
    })

    if (!res.ok) return null

    const payload = (await res.json()) as ApiResponse<ProPublicProfile>
    return payload?.data ?? null
  } catch {
    return null
  }
})

export const fetchProPublicReviews = cache(async (id: string, limit = 20) => {
  try {
    const res = await fetch(`${API_BASE}/pros/${id}/reviews?limit=${limit}`, {
      next: { revalidate: 300 },
    })

    if (!res.ok) return []

    const payload = (await res.json()) as ApiResponse<ProPublicReview[]>
    return Array.isArray(payload?.data) ? payload.data : []
  } catch {
    return []
  }
})

