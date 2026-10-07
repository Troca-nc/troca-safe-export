import { proApi, uploadApi } from '@/lib/api'
import { DEMO, demoOr } from '@/lib/demo'
import { compressImage } from '@/lib/imageCompressor'
import { getProPlans } from '@/lib/data/pro-offers'
import { getRegistrationCommunes, registrationSectors } from '@/lib/data/registration'
import { normalizeRidet } from '@/lib/proUpgradePresentation'
import type { ProUpgradePageData, ProUpgradeResult, ProUpgradeSubmission } from '@/types/pro-upgrade'

export async function getProUpgradePageData(): Promise<ProUpgradePageData> {
  return demoOr(
    async () => (await import('@/demo/fixtures/pro-upgrade')).demoProUpgradePage,
    async () => {
      const [communes, plans] = await Promise.all([getRegistrationCommunes(), getProPlans()])
      return { communes, plans, sectors: registrationSectors }
    },
  )
}

export async function submitProUpgrade({ draft, logoFile }: ProUpgradeSubmission): Promise<ProUpgradeResult> {
  if (DEMO) return { pendingVerification: true, logoSaved: Boolean(logoFile) }

  await proApi.apply({
    company_name: draft.companyName.trim(),
    category: draft.sector,
    description: draft.presentation.trim(),
    phone: draft.phone.trim(),
    commune: draft.commune,
    siret: normalizeRidet(draft.ridet),
  })

  if (!logoFile) return { pendingVerification: true, logoSaved: false }

  try {
    const optimized = await compressImage(logoFile, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 })
    const upload = await uploadApi.uploadChatPhoto(optimized)
    const logoUrl = upload.data?.data?.url
    if (!logoUrl) return { pendingVerification: true, logoSaved: false }
    await proApi.updateProfile({ logo_url: logoUrl })
    return { pendingVerification: true, logoSaved: true }
  } catch {
    return { pendingVerification: true, logoSaved: false }
  }
}
