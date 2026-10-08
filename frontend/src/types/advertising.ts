import type { PlaceholderKey } from '@/content/placeholders'

export type AdvertisingFormatId = 'bon_plan' | 'banner' | 'popup'
export type AdvertisingPreviewMode = 'desktop' | 'mobile'

export type AdvertisingPricingOption = {
  key: string
  pricingMode: 'one_shot' | 'monthly'
  pricingPlan: 'essential' | 'standard' | 'unlimited' | null
  durationDays: number
  priceXpf: number
  label: string
}

export type AdvertisingFormat = {
  id: AdvertisingFormatId
  title: string
  description: string
  placement: string
  targetingLabel: string
  availabilityLabel: string
  concurrentCapacity: number | null
  pricingOptions: AdvertisingPricingOption[]
}

export type AdvertisingAudienceHighlight = {
  placeholderKey: PlaceholderKey
  label: string
}

export type AdvertisingEstimate = {
  formatId: AdvertisingFormatId
  label: 'Estimation indicative'
  impressionsMin: number
  impressionsMax: number
  contactsMin: number
  contactsMax: number
}

export type AdvertisingReportMetric = {
  label: string
  value: string
  detail: string
}

export type AdvertisingReportExample = {
  label: 'Exemple'
  periodLabel: string
  campaignLabel: string
  metrics: AdvertisingReportMetric[]
}

export type AdvertisingPageData = {
  currency: 'XPF'
  formats: AdvertisingFormat[]
  audience: AdvertisingAudienceHighlight[]
  estimates: AdvertisingEstimate[] | null
  reportExample: AdvertisingReportExample
}

export type AdvertisingCallbackDraft = {
  name: string
  email: string
  phone: string
  message: string
  website: string
}
