import type {
  AdvertisingAudienceHighlight,
  AdvertisingFormat,
  AdvertisingFormatId,
  AdvertisingPricingOption,
} from '@/types/advertising'

type UnknownRecord = Record<string, unknown>

export type NormalizedCampaignConfig = {
  currency: 'XPF'
  formats: Array<{
    id: AdvertisingFormatId
    title: string
    concurrentCapacity: number | null
    pricingOptions: AdvertisingPricingOption[]
  }>
}

const formatCopy: Record<AdvertisingFormatId, Pick<AdvertisingFormat, 'description' | 'placement' | 'targetingLabel'>> = {
  bon_plan: {
    description: 'Placez une offre professionnelle dans la sélection visible depuis l’accueil et l’espace Bons plans.',
    placement: 'Accueil et espace Bons plans',
    targetingLabel: 'Audience générale des Bons plans',
  },
  banner: {
    description: 'Installez une bannière au-dessus des annonces d’une catégorie choisie depuis votre espace Pro.',
    placement: 'En-tête d’une catégorie',
    targetingLabel: 'Une catégorie Kalico',
  },
  popup: {
    description: 'Présentez un message prioritaire dans une fenêtre affichée sur la page d’accueil.',
    placement: 'Fenêtre sur la page d’accueil',
    targetingLabel: 'Audience générale de l’accueil',
  },
}

export const advertisingAudience: AdvertisingAudienceHighlight[] = [
  { placeholderKey: 'membres', label: 'membres inscrits' },
  { placeholderKey: 'visitesMois', label: 'visites mensuelles' },
  { placeholderKey: 'partMobile', label: 'du trafic sur mobile' },
]

export const advertisingStudioDefaults = {
  title: 'Votre offre locale',
  description: 'Présentez ici le bénéfice principal de votre campagne.',
  cta: 'Découvrir',
  linkUrl: '',
} as const

export const advertisingTouchpoints = [
  {
    id: 'create',
    title: 'Créer une campagne',
    description: 'Retrouvez le formulaire détaillé, le contenu et le paiement depuis votre espace Pro.',
    href: '/pro/dashboard/publicite',
    linkLabel: 'Ouvrir la gestion publicitaire',
  },
  {
    id: 'track',
    title: 'Suivre la diffusion',
    description: 'Consultez les campagnes actives, en attente ou suspendues depuis la même interface.',
    href: '/pro/dashboard/publicite',
    linkLabel: 'Voir mes campagnes',
  },
  {
    id: 'join',
    title: 'Passer au compte Pro',
    description: 'Préparez votre vitrine professionnelle avant de lancer une campagne locale.',
    href: '/devenir-pro',
    linkLabel: 'Découvrir le parcours Pro',
  },
] as const

const record = (value: unknown): UnknownRecord => value && typeof value === 'object' ? value as UnknownRecord : {}
const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0

function formatId(value: unknown): AdvertisingFormatId | null {
  return value === 'bon_plan' || value === 'banner' || value === 'popup' ? value : null
}

const planLabels: Record<string, string> = {
  essential: 'Essentiel',
  standard: 'Standard',
  unlimited: 'Illimité',
}

function normalizePricingOption(value: unknown): AdvertisingPricingOption | null {
  const item = record(value)
  const pricingMode = item.pricing_mode === 'monthly' ? 'monthly' : item.pricing_mode === 'one_shot' ? 'one_shot' : null
  const durationDays = number(item.duration_days)
  const priceXpf = number(item.price_xpf)
  const pricingPlan = text(item.pricing_plan)
  if (!pricingMode || durationDays <= 0 || priceXpf <= 0) return null

  const plan = pricingMode === 'monthly' && pricingPlan in planLabels
    ? pricingPlan as AdvertisingPricingOption['pricingPlan']
    : null
  const label = pricingMode === 'monthly'
    ? `${plan ? planLabels[plan] : 'Mensuel'} · 30 jours`
    : `${durationDays} jours`

  return {
    key: pricingMode === 'monthly' ? `monthly-${plan ?? 'essential'}` : `one-shot-${durationDays}`,
    pricingMode,
    pricingPlan: plan,
    durationDays,
    priceXpf,
    label,
  }
}

export function normalizeCampaignConfig(payload: unknown): NormalizedCampaignConfig {
  const root = record(payload)
  const source = Array.isArray(root.formats) ? root : record(root.data)
  const formats = Array.isArray(source.formats) ? source.formats : []

  const normalized = formats.flatMap((value) => {
    const item = record(value)
    const id = formatId(item.type)
    if (!id) return []
    const pricingOptions = Array.isArray(item.pricing_options)
      ? item.pricing_options.map(normalizePricingOption).filter((option): option is AdvertisingPricingOption => Boolean(option))
      : []
    return [{
      id,
      title: text(item.label) || id,
      concurrentCapacity: number(item.concurrent_capacity) || null,
      pricingOptions,
    }]
  })

  const required: AdvertisingFormatId[] = ['bon_plan', 'banner', 'popup']
  if (source.currency !== 'XPF' || required.some((id) => !normalized.some((format) => format.id === id))) {
    throw new Error('La configuration publicitaire est indisponible.')
  }

  return {
    currency: 'XPF',
    formats: required.map((id) => normalized.find((format) => format.id === id)!),
  }
}

export function buildAdvertisingFormats(config: NormalizedCampaignConfig): AdvertisingFormat[] {
  return config.formats.map((format) => ({
    ...format,
    ...formatCopy[format.id],
    availabilityLabel: format.concurrentCapacity
      ? `${format.concurrentCapacity} emplacement${format.concurrentCapacity > 1 ? 's' : ''} simultané${format.concurrentCapacity > 1 ? 's' : ''}`
      : 'Capacité communiquée dans l’espace Pro',
  }))
}

export const formatXpf = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} XPF`

export function formatStartingPrice(format: AdvertisingFormat) {
  const prices = format.pricingOptions.map((option) => option.priceXpf).filter((price) => price > 0)
  return prices.length ? `À partir de ${formatXpf(Math.min(...prices))}` : 'Tarifs masqués en démonstration'
}
