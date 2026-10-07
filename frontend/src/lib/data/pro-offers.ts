import { subscriptionsApi } from '@/lib/api'
import { demoOr } from '@/lib/demo'
import { normalizeProPlans, proModules, proSectors } from '@/lib/proOffersPresentation'
import type { ProOfferPageData, ProPlan } from '@/types/pro-offers'

export async function getProOfferPageData(): Promise<ProOfferPageData> {
  return demoOr(
    async () => (await import('@/demo/fixtures/pro-offers')).demoProOfferPage,
    async () => {
      const response = await subscriptionsApi.getPlans()
      return {
        plans: normalizeProPlans(response.data),
        modules: proModules,
        sectors: proSectors,
      }
    },
  )
}

export async function getProPlans(): Promise<ProPlan[]> {
  return (await getProOfferPageData()).plans
}
