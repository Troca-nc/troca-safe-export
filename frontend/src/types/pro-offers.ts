export type ProBillingCycle = 'monthly' | 'yearly'

export type ProPlanId = 'free' | 'pro'

export type ProBillingOfferId = 'free' | 'pro-monthly' | 'pro-yearly'

export type ProLimit = number | 'unlimited' | 'permanent'

export type ProBoostAccess = 'paid' | 'discount'

export interface ProPlanFeatures {
  maxActiveListings: ProLimit
  maxPhotosPerListing: ProLimit
  listingDurationDays: ProLimit
  chat: boolean
  phoneVerification: boolean
  listingStats: boolean
  sellerBadge: boolean
  boosts: ProBoostAccess
  pinnedPerCategory: number
  prioritySupport: boolean
}

export interface ProPlan {
  id: ProPlanId
  name: string
  monthlyPriceXpf: number
  yearlyPriceXpf: number
  savingsMonths: number
  features: ProPlanFeatures
}

export type ProModuleKey = 'showcase' | 'quotes' | 'bookings' | 'transport' | 'delivery' | 'visibility'

export interface ProModule {
  id: ProModuleKey
  eyebrow: string
  title: string
  description: string
  benefits: string[]
}

export interface ProSector {
  id: string
  title: string
  description: string
  icon: 'building' | 'car' | 'hammer' | 'utensils' | 'users' | 'truck' | 'home' | 'store'
}

export interface ProOfferPageData {
  plans: ProPlan[]
  modules: ProModule[]
  sectors: ProSector[]
}

export interface ProComparisonRow {
  label: string
  free: string
  pro: string
}
