import { campaignsApi, contactApi } from '@/lib/api'
import { DEMO, demoOr } from '@/lib/demo'
import { advertisingAudience, buildAdvertisingFormats, normalizeCampaignConfig } from '@/lib/advertisingPresentation'
import type { AdvertisingCallbackDraft, AdvertisingPageData } from '@/types/advertising'

export async function getAdvertisingPageData(): Promise<AdvertisingPageData> {
  if (DEMO) return (await import('@/demo/fixtures/ads')).demoAdvertisingPageData

  const [response, fixture] = await Promise.all([
    campaignsApi.getPublicConfig(),
    import('@/demo/fixtures/ads'),
  ])
  const config = normalizeCampaignConfig(response.data)
  return {
    currency: config.currency,
    formats: buildAdvertisingFormats(config),
    audience: advertisingAudience,
    estimates: null,
    reportExample: fixture.advertisingReportExample,
  }
}

export async function requestAdvertisingCallback(draft: AdvertisingCallbackDraft) {
  return demoOr(
    async () => ({ success: true }),
    async () => {
      const response = await contactApi.send({
        name: draft.name.trim(),
        email: draft.email.trim(),
        category: 'pro',
        subject: 'Demande de rappel Kalico Pub',
        message: [
          `Téléphone : ${draft.phone.trim() || 'Non renseigné'}`,
          `Projet publicitaire : ${draft.message.trim() || 'Demande de présentation des formats disponibles.'}`,
        ].join('\n\n'),
        website: draft.website.trim(),
      })
      return response.data
    },
  )
}
