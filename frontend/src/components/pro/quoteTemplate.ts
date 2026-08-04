export type QuoteTemplate = {
  title: string
  subtitle: string
  need_type_label: string
  need_type_placeholder: string
  commune_label: string
  commune_placeholder: string
  requester_phone_label: string
  requester_phone_placeholder: string
  budget_label: string
  budget_placeholder: string
  desired_date_label: string
  desired_date_placeholder: string
  details_label: string
  details_placeholder: string
  show_phone: boolean
  show_budget: boolean
  show_date: boolean
  show_details: boolean
  budget_presets: number[]
}

export type QuoteTemplatePresetKey = 'artisan' | 'commercant' | 'service'

export const DEFAULT_QUOTE_TEMPLATE: QuoteTemplate = {
  title: 'Demander un devis',
  subtitle: 'Dï¿½crivez votre besoin et recevez une rï¿½ponse plus prï¿½cise du professionnel.',
  need_type_label: 'Type de besoin',
  need_type_placeholder: 'Plomberie, rï¿½novation, logo...',
  commune_label: 'Commune',
  commune_placeholder: 'NoumÃ©a, DumbÃ©a...',
  requester_phone_label: 'Tï¿½lï¿½phone',
  requester_phone_placeholder: 'XX XX XX XX',
  budget_label: 'Budget estimï¿½',
  budget_placeholder: '25000',
  desired_date_label: 'Date souhaitï¿½e',
  desired_date_placeholder: '',
  details_label: 'Prï¿½cisions',
  details_placeholder: "Expliquez votre besoin, les contraintes, le niveau d'urgence...",
  show_phone: true,
  show_budget: true,
  show_date: true,
  show_details: true,
  budget_presets: [15000, 30000, 50000],
}

export const QUOTE_TEMPLATE_PRESETS: Record<QuoteTemplatePresetKey, QuoteTemplate> = {
  artisan: {
    ...DEFAULT_QUOTE_TEMPLATE,
    title: 'Demander un devis artisan',
    subtitle: 'Dï¿½crivez votre chantier et recevez une estimation adaptï¿½e ï¿½ vos contraintes.',
    need_type_label: 'Type de chantier',
    need_type_placeholder: 'Plomberie, peinture, ï¿½lectricitï¿½...',
    commune_label: 'Commune du chantier',
    commune_placeholder: 'NoumÃ©a, DumbÃ©a...',
    requester_phone_label: 'Tï¿½lï¿½phone de contact',
    requester_phone_placeholder: 'XX XX XX XX',
    budget_label: 'Budget chantier',
    budget_placeholder: '50000',
    desired_date_label: 'Date souhaitï¿½e',
    desired_date_placeholder: '',
    details_label: 'Dï¿½tails du projet',
    details_placeholder: 'Surface, accï¿½s, urgence, matï¿½riaux souhaitï¿½s...',
    budget_presets: [25000, 50000, 100000],
  },
  commercant: {
    ...DEFAULT_QUOTE_TEMPLATE,
    title: 'Demander un devis commerï¿½ant',
    subtitle: 'Prï¿½parez votre demande pour un produit, une livraison ou une commande spï¿½ciale.',
    need_type_label: 'Type de besoin',
    need_type_placeholder: 'Commande, livraison, stock, commande spï¿½ciale...',
    commune_label: 'Commune de livraison',
    commune_placeholder: 'NoumÃ©a, Paï¿½ta...',
    requester_phone_label: 'Tï¿½lï¿½phone',
    requester_phone_placeholder: 'XX XX XX XX',
    budget_label: 'Budget estimï¿½',
    budget_placeholder: '30000',
    desired_date_label: 'Date de livraison souhaitï¿½e',
    desired_date_placeholder: '',
    details_label: 'Quantitï¿½s et prï¿½cisions',
    details_placeholder: 'Quantitï¿½s, dï¿½lais, produits recherchï¿½s, contraintes...',
    budget_presets: [10000, 30000, 50000],
  },
  service: {
    ...DEFAULT_QUOTE_TEMPLATE,
    title: 'Demander un devis service',
    subtitle: 'Expliquez votre besoin pour obtenir une rï¿½ponse rapide et claire.',
    need_type_label: 'Type de prestation',
    need_type_placeholder: 'Logo, site web, ï¿½vï¿½nement, transport...',
    commune_label: 'Commune',
    commune_placeholder: 'NoumÃ©a, DumbÃ©a...',
    requester_phone_label: 'Tï¿½lï¿½phone',
    requester_phone_placeholder: 'XX XX XX XX',
    budget_label: 'Budget projet',
    budget_placeholder: '20000',
    desired_date_label: 'Date souhaitï¿½e',
    desired_date_placeholder: '',
    details_label: 'Prï¿½cisions',
    details_placeholder: "Dï¿½crivez le contexte, l'objectif, le dï¿½lai et vos attentes...",
    budget_presets: [15000, 25000, 50000],
  },
}

function normalizeText(value: unknown, fallback: string) {
  const text = String(value ?? '').trim()
  return text.length > 0 ? text : fallback
}

function normalizeBudgetPresets(value: unknown) {
  if (!Array.isArray(value)) return DEFAULT_QUOTE_TEMPLATE.budget_presets
  const normalized = value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry) && entry > 0)
    .map((entry) => Math.round(entry))
    .slice(0, 6)
  return normalized.length > 0 ? normalized : DEFAULT_QUOTE_TEMPLATE.budget_presets
}

export function normalizeQuoteTemplate(input: unknown): QuoteTemplate {
  if (!input || typeof input !== 'object') {
    return { ...DEFAULT_QUOTE_TEMPLATE, budget_presets: [...DEFAULT_QUOTE_TEMPLATE.budget_presets] }
  }

  const source = input as Partial<QuoteTemplate> & Record<string, unknown>
  return {
    title: normalizeText(source.title, DEFAULT_QUOTE_TEMPLATE.title),
    subtitle: normalizeText(source.subtitle, DEFAULT_QUOTE_TEMPLATE.subtitle),
    need_type_label: normalizeText(source.need_type_label, DEFAULT_QUOTE_TEMPLATE.need_type_label),
    need_type_placeholder: normalizeText(source.need_type_placeholder, DEFAULT_QUOTE_TEMPLATE.need_type_placeholder),
    commune_label: normalizeText(source.commune_label, DEFAULT_QUOTE_TEMPLATE.commune_label),
    commune_placeholder: normalizeText(source.commune_placeholder, DEFAULT_QUOTE_TEMPLATE.commune_placeholder),
    requester_phone_label: normalizeText(source.requester_phone_label, DEFAULT_QUOTE_TEMPLATE.requester_phone_label),
    requester_phone_placeholder: normalizeText(source.requester_phone_placeholder, DEFAULT_QUOTE_TEMPLATE.requester_phone_placeholder),
    budget_label: normalizeText(source.budget_label, DEFAULT_QUOTE_TEMPLATE.budget_label),
    budget_placeholder: normalizeText(source.budget_placeholder, DEFAULT_QUOTE_TEMPLATE.budget_placeholder),
    desired_date_label: normalizeText(source.desired_date_label, DEFAULT_QUOTE_TEMPLATE.desired_date_label),
    desired_date_placeholder: normalizeText(source.desired_date_placeholder, DEFAULT_QUOTE_TEMPLATE.desired_date_placeholder),
    details_label: normalizeText(source.details_label, DEFAULT_QUOTE_TEMPLATE.details_label),
    details_placeholder: normalizeText(source.details_placeholder, DEFAULT_QUOTE_TEMPLATE.details_placeholder),
    show_phone: typeof source.show_phone === 'boolean' ? source.show_phone : DEFAULT_QUOTE_TEMPLATE.show_phone,
    show_budget: typeof source.show_budget === 'boolean' ? source.show_budget : DEFAULT_QUOTE_TEMPLATE.show_budget,
    show_date: typeof source.show_date === 'boolean' ? source.show_date : DEFAULT_QUOTE_TEMPLATE.show_date,
    show_details: typeof source.show_details === 'boolean' ? source.show_details : DEFAULT_QUOTE_TEMPLATE.show_details,
    budget_presets: normalizeBudgetPresets(source.budget_presets),
  }
}

export function parseBudgetPresetInput(value: string) {
  return value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part) && part > 0)
    .map((part) => Math.round(part))
    .slice(0, 6)
}

export function formatBudgetPresetInput(presets: number[]) {
  return presets.map((value) => String(value)).join(', ')
}

export function getQuoteTemplatePreset(key: QuoteTemplatePresetKey) {
  return normalizeQuoteTemplate(QUOTE_TEMPLATE_PRESETS[key])
}
