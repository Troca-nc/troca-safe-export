import type {
  ProBillingCycle,
  ProComparisonRow,
  ProModule,
  ProPlan,
  ProPlanFeatures,
  ProSector,
} from '../types/pro-offers'

type UnknownRecord = Record<string, unknown>

const record = (value: unknown): UnknownRecord => value && typeof value === 'object' ? value as UnknownRecord : {}
const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0
const boolean = (value: unknown) => value === true

const limit = (value: unknown, fallback = 0): number | 'unlimited' | 'permanent' => {
  if (value === 'unlimited' || value === 'permanent') return value
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

export const proModules: ProModule[] = [
  {
    id: 'showcase',
    eyebrow: 'Vitrine et catalogue',
    title: 'Présentez votre activité avec un espace public clair',
    description: 'Regroupez votre identité, vos horaires, vos coordonnées et votre catalogue dans une vitrine facile à partager.',
    benefits: ['Profil public professionnel', 'Catalogue de produits et services', 'Avis clients et coordonnées', 'Prise de rendez-vous'],
  },
  {
    id: 'quotes',
    eyebrow: 'Devis',
    title: 'Préparez et suivez vos devis au même endroit',
    description: 'Structurez chaque demande, envoyez une proposition lisible et gardez son statut à portée de main.',
    benefits: ['Création de devis en XPF', 'Envoi au client', 'Suivi des statuts', 'Export du document'],
  },
  {
    id: 'bookings',
    eyebrow: 'Réservations',
    title: 'Ouvrez des créneaux adaptés à votre activité',
    description: 'Centralisez les disponibilités et les demandes de rendez-vous depuis votre espace professionnel.',
    benefits: ['Gestion des disponibilités', 'Réservation en ligne', 'Notifications de suivi', 'Historique des rendez-vous'],
  },
  {
    id: 'transport',
    eyebrow: 'Transport Pro',
    title: 'Organisez vos courses et vos réservations',
    description: 'Utilisez les outils métier prévus pour les transporteurs et les conducteurs professionnels.',
    benefits: ['Profil professionnel', 'Gestion des courses', 'Réservations centralisées', 'Suivi de l’activité'],
  },
  {
    id: 'delivery',
    eyebrow: 'Envoi et livraison',
    title: 'Répondez aux besoins de transport de marchandises',
    description: 'Présentez vos capacités et suivez les demandes de livraison depuis un espace unique.',
    benefits: ['Annonces de transport', 'Demandes détaillées', 'Mise en relation locale', 'Suivi des échanges'],
  },
  {
    id: 'visibility',
    eyebrow: 'Visibilité',
    title: 'Mesurez et renforcez votre présence sur Kalico',
    description: 'Accédez aux statistiques, au badge vendeur et aux options de mise en avant prévues par votre formule.',
    benefits: ['Statistiques des annonces', 'Badge vendeur Pro', 'Boosts à tarif Pro', 'Épinglage par catégorie'],
  },
]

export const proSectors: ProSector[] = [
  { id: 'immobilier', title: 'Immobilier', description: 'Vitrines, biens et prises de contact', icon: 'building' },
  { id: 'auto', title: 'Auto et moto', description: 'Véhicules, entretien et devis', icon: 'car' },
  { id: 'btp', title: 'Artisanat et BTP', description: 'Prestations, chantiers et rendez-vous', icon: 'hammer' },
  { id: 'restauration', title: 'Restauration', description: 'Carte, actualités et réservations', icon: 'utensils' },
  { id: 'transport', title: 'Transport de personnes', description: 'Courses, trajets et planning', icon: 'users' },
  { id: 'livraison', title: 'Envoi et livraison', description: 'Demandes, offres et suivi', icon: 'truck' },
  { id: 'domicile', title: 'Services à domicile', description: 'Catalogue, créneaux et avis', icon: 'home' },
  { id: 'commerce', title: 'Commerce', description: 'Produits, annonces et visibilité', icon: 'store' },
]

function normalizeFeatures(value: unknown): ProPlanFeatures {
  const features = record(value)
  return {
    maxActiveListings: limit(features.maxActiveListings),
    maxPhotosPerListing: limit(features.maxPhotosPerListing),
    listingDurationDays: limit(features.listingDurationDays),
    chat: boolean(features.chat),
    phoneVerification: boolean(features.phoneVerification),
    listingStats: boolean(features.listingStats),
    sellerBadge: boolean(features.sellerBadge),
    boosts: features.boosts === 'discount' ? 'discount' : 'paid',
    pinnedPerCategory: number(features.pinnedPerCategory),
    prioritySupport: boolean(features.prioritySupport),
  }
}

export function normalizeProPlans(payload: unknown): ProPlan[] {
  const root = record(payload)
  const data = record(root.data)
  const source = Array.isArray(data.plans) ? data.plans : Array.isArray(root.plans) ? root.plans : []
  const plans = source.map(record)
  const free = plans.find((plan) => text(plan.id) === 'free')
  const pro = plans.find((plan) => text(plan.id) === 'pro')

  if (!free || !pro) throw new Error('Le catalogue des offres est indisponible.')

  return [
    {
      id: 'free',
      name: text(free.name) || 'Gratuit',
      monthlyPriceXpf: number(free.price_monthly_xpf),
      yearlyPriceXpf: number(free.price_yearly_xpf),
      savingsMonths: number(free.savings_months),
      features: normalizeFeatures(free.features),
    },
    {
      id: 'pro',
      name: text(pro.name) || 'Pro',
      monthlyPriceXpf: number(pro.price_monthly_xpf),
      yearlyPriceXpf: number(pro.price_yearly_xpf),
      savingsMonths: number(pro.savings_months),
      features: normalizeFeatures(pro.features),
    },
  ]
}

export const formatXpf = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} XPF`

export function getDisplayedPrice(plan: ProPlan, cycle: ProBillingCycle) {
  return cycle === 'yearly' ? plan.yearlyPriceXpf : plan.monthlyPriceXpf
}

export function getAnnualSavingsXpf(plan: ProPlan) {
  return Math.max(0, plan.monthlyPriceXpf * 12 - plan.yearlyPriceXpf)
}

const yesNo = (value: boolean) => value ? 'Inclus' : 'Non inclus'
const limitLabel = (value: number | 'unlimited' | 'permanent', unit: string) => {
  if (value === 'unlimited') return 'Illimitées'
  if (value === 'permanent') return 'Permanente'
  return `${value} ${unit}`
}

export function buildComparisonRows(plans: ProPlan[]): ProComparisonRow[] {
  const free = plans.find((plan) => plan.id === 'free')
  const pro = plans.find((plan) => plan.id === 'pro')
  if (!free || !pro) return []
  return [
    { label: 'Annonces actives', free: limitLabel(free.features.maxActiveListings, 'annonces'), pro: limitLabel(pro.features.maxActiveListings, 'annonces') },
    { label: 'Photos par annonce', free: limitLabel(free.features.maxPhotosPerListing, 'photos'), pro: limitLabel(pro.features.maxPhotosPerListing, 'photos') },
    { label: 'Durée des annonces', free: limitLabel(free.features.listingDurationDays, 'jours'), pro: limitLabel(pro.features.listingDurationDays, 'jours') },
    { label: 'Messagerie', free: yesNo(free.features.chat), pro: yesNo(pro.features.chat) },
    { label: 'Vérification du téléphone', free: yesNo(free.features.phoneVerification), pro: yesNo(pro.features.phoneVerification) },
    { label: 'Statistiques des annonces', free: yesNo(free.features.listingStats), pro: yesNo(pro.features.listingStats) },
    { label: 'Badge vendeur', free: yesNo(free.features.sellerBadge), pro: yesNo(pro.features.sellerBadge) },
    { label: 'Boosts', free: free.features.boosts === 'discount' ? 'Tarif Pro' : 'Tarif standard', pro: pro.features.boosts === 'discount' ? 'Tarif Pro' : 'Tarif standard' },
    { label: 'Épinglage par catégorie', free: free.features.pinnedPerCategory ? String(free.features.pinnedPerCategory) : 'Non inclus', pro: pro.features.pinnedPerCategory ? String(pro.features.pinnedPerCategory) : 'Non inclus' },
    { label: 'Support prioritaire', free: yesNo(free.features.prioritySupport), pro: yesNo(pro.features.prioritySupport) },
  ]
}

export function planFeatureHighlights(plan: ProPlan) {
  return [
    limitLabel(plan.features.maxActiveListings, 'annonces actives'),
    limitLabel(plan.features.maxPhotosPerListing, 'photos par annonce'),
    plan.features.listingStats ? 'Statistiques des annonces' : 'Messagerie intégrée',
  ]
}
