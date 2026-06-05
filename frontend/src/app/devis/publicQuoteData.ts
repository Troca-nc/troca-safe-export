import { cache } from 'react'

import { SITE_URL } from '@/types/seo.types'

export type PublicQuoteItem = {
  id?: string
  label: string
  description?: string | null
  quantity: number
  unit_price_xpf: number
  total_xpf: number
}

export type PublicQuote = {
  id: number | string
  quote_number: string
  pro_id: number | string
  requester_name: string
  requester_email: string
  requester_phone?: string | null
  commune: string
  subject: string
  client_note?: string | null
  items: PublicQuoteItem[]
  subtotal_xpf: number
  tax_rate: number
  tax_amount_xpf: number
  total_xpf: number
  validity_days: number
  status: string
  valid_until?: string | null
  sent_at?: string | null
  viewed_at?: string | null
  accepted_at?: string | null
  refused_at?: string | null
  refused_reason?: string | null
  pro: {
    id: number | string
    display_name: string
    pro_company_name?: string | null
    pro_commune?: string | null
    pro_category?: string | null
    pro_phone?: string | null
    pro_website?: string | null
  }
  share_token?: string | null
}

type ApiResponse<T> = {
  data?: T
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? `${SITE_URL}/api`).replace(/\/$/, '')

export const fetchPublicQuote = cache(async (id: string, token?: string) => {
  try {
    const res = await fetch(`${API_BASE}/pro-quotes/${id}${token ? `?token=${encodeURIComponent(token)}` : ''}`, {
      next: { revalidate: 120 },
    })
    if (!res.ok) return null
    const payload = (await res.json()) as ApiResponse<PublicQuote>
    return payload?.data ?? null
  } catch {
    return null
  }
})
