import { proApi } from '@/lib/api'
import { demoOr } from '@/lib/demo'
import type { ProSummary } from '@/types/pro-public'

type UnknownRecord = Record<string, unknown>
const record = (value: unknown): UnknownRecord => value && typeof value === 'object' ? value as UnknownRecord : {}
const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0

export function normalizeProSummary(value: unknown): ProSummary | null {
  const item = record(value)
  const id = number(item.id)
  const firstName = text(item.prenom)
  const lastName = text(item.nom)
  const companyName = text(item.pro_company_name)
  const name = text(item.display_name) || companyName || [firstName, lastName].filter(Boolean).join(' ')
  if (!id || !name) return null
  return {
    id, name, firstName, lastName, companyName,
    category: text(item.pro_category) || 'Professionnel local',
    commune: text(item.pro_commune) || 'Nouvelle-Calédonie',
    description: text(item.pro_description),
    logoUrl: text(item.pro_logo_url) || null,
    bannerUrl: text(item.pro_banner_url) || null,
    rating: number(item.avg_rating),
    reviewCount: number(item.review_count),
    listingCount: number(item.listing_count),
    latestReview: text(item.latest_review_comment) || null,
    verified: true,
    quoteTemplate: item.pro_quote_template,
  }
}

export async function getProsDirectory(): Promise<ProSummary[]> {
  return demoOr(
    async () => (await import('@/demo/fixtures/pros')).demoPros,
    async () => {
      const response = await proApi.list({ limit: 100 })
      const values = Array.isArray(response.data?.data) ? response.data.data : []
      return values.map(normalizeProSummary).filter((pro): pro is ProSummary => Boolean(pro))
    },
  )
}
