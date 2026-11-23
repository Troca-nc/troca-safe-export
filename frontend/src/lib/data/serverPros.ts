import { cache } from 'react'

import { demoOr } from '@/lib/demo'
import { serverPublicFetch } from '@/lib/serverPublicApi'
import type { ProPublicProfile, ProPublicReview } from '@/types/pro-public'

type ApiResponse<T> = { data?: T }

export const fetchServerProPublicProfile = cache(async (id: string) => demoOr(
  async () => id === '1401' ? (await import('@/demo/fixtures/pros')).demoProProfile : null,
  async () => {
    const response = await serverPublicFetch(`/pros/${encodeURIComponent(id)}`, { next: { revalidate: 300 } })
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Pro profile request failed with status ${response.status}`)
    const payload = (await response.json()) as ApiResponse<ProPublicProfile>
    return payload.data ?? null
  },
))

export const fetchServerProPublicReviews = cache(async (id: string, limit = 20) => demoOr(
  async () => id === '1401' ? (await import('@/demo/fixtures/pros')).demoProReviews.slice(0, limit) : [],
  async () => {
    const response = await serverPublicFetch(`/pros/${encodeURIComponent(id)}/reviews?limit=${limit}`, { next: { revalidate: 300 } })
    if (!response.ok) return []
    const payload = (await response.json()) as ApiResponse<ProPublicReview[]>
    return Array.isArray(payload.data) ? payload.data : []
  },
))
