import { DEMO, demoOr } from '@/lib/demo'
import { proApi, proBookingsApi, proQuotesApi, reviewsApi } from '@/lib/api'
import type {
  ProQuote,
  ProQuoteTemplate,
  ProQuoteTemplateInput,
  ProSpaceData,
} from '@/types/pro-space'

const emptyReviewSummary = { avg_rating: 0, review_count: 0, verified_count: 0 }

export async function getProSpaceData(proId: number): Promise<ProSpaceData> {
  return demoOr(
    async () => (await import('@/demo/fixtures/pro-space')).demoProSpaceData,
    async () => {
      const [dashboard, products, requests, quotes, bookings, templates, quoteConfig, reviews, profile] = await Promise.all([
        proApi.getDashboard(),
        proApi.getProducts(),
        proApi.getQuoteRequestsReceived({ limit: 100 }),
        proQuotesApi.list(),
        proBookingsApi.getDashboard(),
        proQuotesApi.listTemplates(),
        proQuotesApi.getConfig(),
        reviewsApi.getByPro(proId).catch(() => null),
        proApi.getById(proId).catch(() => null),
      ])

      return {
        dashboard: dashboard.data?.data,
        products: products.data?.data ?? [],
        requests: requests.data?.data ?? [],
        quotes: quotes.data?.data ?? [],
        bookings: bookings.data?.data?.bookings ?? [],
        reviewSummary: reviews?.data?.data?.summary ?? emptyReviewSummary,
        reviews: reviews?.data?.data?.reviews ?? [],
        reviewsUnavailable: reviews === null,
        profile: profile?.data?.data ?? null,
        profileUnavailable: profile === null,
        templates: templates.data?.data ?? [],
        quoteConfig: quoteConfig.data?.data,
      }
    },
  )
}

export async function saveProQuoteTemplate(
  input: ProQuoteTemplateInput,
  id?: number | string,
): Promise<ProQuoteTemplate> {
  if (DEMO) {
    const now = new Date().toISOString()
    return { ...input, id: id ?? `demo-${Date.now()}`, pro_id: 0, created_at: now, updated_at: now }
  }
  const response = id == null
    ? await proQuotesApi.createTemplate(input)
    : await proQuotesApi.updateTemplate(id, input)
  return response.data?.data
}

export async function deleteProQuoteTemplate(id: number | string): Promise<void> {
  if (DEMO) return
  await proQuotesApi.deleteTemplate(id)
}

export async function remindProQuote(id: number): Promise<ProQuote | null> {
  if (DEMO) return null
  const response = await proQuotesApi.remind(id)
  return response.data?.data ?? null
}

export async function markProQuotePaid(id: number): Promise<ProQuote | null> {
  if (DEMO) return null
  const response = await proQuotesApi.markPaid(id)
  return response.data?.data ?? null
}
