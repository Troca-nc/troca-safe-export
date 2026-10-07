import type { ProBillingCycle, ProPlan, ProPlanId } from './pro-offers'

export interface ProUpgradeCommune {
  id: number
  name: string
}

export interface ProUpgradeDraft {
  companyName: string
  sector: string
  phone: string
  ridet: string
  commune: string
  presentation: string
  selectedPlanId: ProPlanId
  billingCycle: ProBillingCycle
}

export interface ProUpgradePageData {
  communes: ProUpgradeCommune[]
  plans: ProPlan[]
  sectors: readonly string[]
  suggestedDraft?: Partial<ProUpgradeDraft>
}

export interface ProUpgradeSubmission {
  draft: ProUpgradeDraft
  logoFile?: File | null
}

export interface ProUpgradeResult {
  pendingVerification: true
  logoSaved: boolean
}

export type ProUpgradeFieldErrors = Partial<Record<keyof ProUpgradeDraft, string>>
