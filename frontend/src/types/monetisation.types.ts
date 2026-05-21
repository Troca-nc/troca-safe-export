// src/types/monetisation.types.ts

export type BoostType =
  | 'une'
  | 'urgent'
  | 'remonte'
  | 'photos'

export type BoostDuration = 3 | 7 | 14 | 30

export interface BoostOption {
  type: BoostType
  duration: BoostDuration
  label: string
  description: string
  price_xpf: number
  emoji: string
}

export const BOOST_CATALOG: BoostOption[] = [
  { type: 'une', duration: 7, label: 'A la une', description: 'En tete de liste pendant 7 jours', price_xpf: 1200, emoji: '⭐' },
  { type: 'une', duration: 14, label: 'A la une — 14j', description: 'En tete de liste pendant 14 jours', price_xpf: 2000, emoji: '⭐' },
  { type: 'urgent', duration: 7, label: 'Badge Urgent', description: 'Picto "Urgent" pendant 7 jours', price_xpf: 500, emoji: '🔴' },
  { type: 'remonte', duration: 3, label: 'Remettre en avant', description: 'Retour en tete pendant 3 jours', price_xpf: 400, emoji: '📈' },
  { type: 'photos', duration: 30, label: 'Pack photos', description: "Jusqu'a 15 photos pendant 30 jours", price_xpf: 300, emoji: '📷' },
]

export type PlanId = 'pro' | 'pro_plus'
export type BillingPeriod = 'monthly' | 'yearly'

export interface ProPlan {
  id: PlanId
  label: string
  price_monthly: number
  price_yearly: number
  savings_pct: number
  features: string[]
  highlight: boolean
  stripe_price_id_monthly: string
  stripe_price_id_yearly: string
  payplug_plan_id_monthly: string
  payplug_plan_id_yearly: string
}

export const PRO_PLANS: ProPlan[] = [
  {
    id: 'pro',
    label: 'Pro Essentiel',
    price_monthly: 3900,
    price_yearly: 39000,
    savings_pct: 17,
    highlight: false,
    stripe_price_id_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? '',
    stripe_price_id_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY ?? '',
    payplug_plan_id_monthly: process.env.NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY ?? '',
    payplug_plan_id_yearly: process.env.NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY ?? '',
    features: [
      '5 annonces actives incluses',
      'Vitrine vendeur professionnelle',
      'Badge Pro sur vos annonces',
      'Statistiques simples (vues, contacts)',
      'Boosts et mises en avant a la carte',
      'Support prioritaire par email',
    ],
  },
  {
    id: 'pro_plus',
    label: 'Pro Plus',
    price_monthly: 7900,
    price_yearly: 79000,
    savings_pct: 17,
    highlight: true,
    stripe_price_id_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_PLUS_MONTHLY ?? '',
    stripe_price_id_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_PLUS_YEARLY ?? '',
    payplug_plan_id_monthly: process.env.NEXT_PUBLIC_PAYPLUG_PLAN_PRO_PLUS_MONTHLY ?? '',
    payplug_plan_id_yearly: process.env.NEXT_PUBLIC_PAYPLUG_PLAN_PRO_PLUS_YEARLY ?? '',
    features: [
      'Tout du plan Pro Essentiel',
      '25 annonces actives incluses',
      'Vitrine premium et priorite de visibilite',
      '1 bon plan visible 3 jours offert par mois',
      '3 boosts A la une offerts par mois',
      'Support telephonique prioritaire',
    ],
  },
]

export type PaymentProvider = 'stripe' | 'payplug'
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'
export type PaymentType = 'boost' | 'subscription'

export interface Payment {
  id: number
  user_id: number
  type: PaymentType
  provider: PaymentProvider
  provider_ref: string
  amount_xpf: number
  status: PaymentStatus
  metadata: Record<string, unknown>
  created_at: string
}

export interface Subscription {
  id: number
  user_id: number
  plan_id: PlanId
  billing_period: BillingPeriod
  provider: PaymentProvider
  provider_sub_id: string
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
}

export interface AnnonceBoost {
  id: number
  annonce_id: number
  type: BoostType
  starts_at: string
  expires_at: string
  payment_id: number
}

export function formatXPF(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} XPF`
}

export function isBoostActive(boost: AnnonceBoost): boolean {
  const now = new Date()
  return new Date(boost.starts_at) <= now && now <= new Date(boost.expires_at)
}
