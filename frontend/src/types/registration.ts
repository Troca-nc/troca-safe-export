import type { ProBillingOfferId } from './pro-offers'

export type RegistrationAccountType = 'particulier' | 'pro'

export type RegistrationStep =
  | 'type'
  | 'info'
  | 'credentials'
  | 'verify'
  | 'plan'
  | 'done'

export type RegistrationPlanId = ProBillingOfferId

export interface RegistrationCommune {
  id: number
  name: string
}

export interface RegistrationOffer {
  id: RegistrationPlanId
  name: string
  priceXpf: number
  cadence: string
  features: string[]
  recommended?: boolean
}

export interface RegistrationDraft {
  accountType: RegistrationAccountType
  step: RegistrationStep
  firstName: string
  lastName: string
  communeId: string
  communeName: string
  phone: string
  companyName: string
  ridet: string
  sector: string
  newsletter: boolean
  selectedPlan: RegistrationPlanId
  accountCreated: boolean
  phoneVerified: boolean
}

export interface ProfessionalRegistrationProfile {
  companyName: string
  sector: string
  ridet: string
  commune: string
  phone: string
}

export interface RegistrationErrorPresentation {
  message: string
  retryable: boolean
  emailAlreadyUsed?: boolean
}
