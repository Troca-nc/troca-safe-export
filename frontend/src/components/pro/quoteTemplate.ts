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
  subtitle: 'D�crivez votre besoin et recevez une r�ponse plus pr�cise du professionnel.',
  need_type_label: 'Type de besoin',
  need_type_placeholder: 'Plomberie, r�novation, logo...',
  commune_label: 'Commune',
  commune_placeholder: 'Noum�a, Dumb�a...',
  requester_phone_label: 'T�l�phone',
  requester_phone_placeholder: 'XX XX XX XX',
  budget_label: 'Budget estim�',
  budget_placeholder: '25000',
  desired_date_label: 'Date souhait�e',
  desired_date_placeholder: '',
  details_label: 'Pr�cisions',
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
    subtitle: 'D�crivez votre chantier et recevez une estimation adapt�e � vos contraintes.',
    need_type_label: 'Type de chantier',
    need_type_placeholder: 'Plomberie, peinture, �lectricit�...',
    commune_label: 'Commune du chantier',
    commune_placeholder: 'Noum�a, Dumb�a...',
    requester_phone_label: 'T�l�phone de contact',
    requester_phone_placeholder: 'XX XX XX XX',
    budget_label: 'Budget chantier',
    budget_placeholder: '50000',
    desired_date_label: 'Date souhait�e',
    desired_date_placeholder: '',
    details_label: 'D�tails du projet',
    details_placeholder: 'Surface, acc�s, urgence, mat�riaux souhait�s...',
    budget_presets: [25000, 50000, 100000],
  },
  commercant: {
    ...DEFAULT_QUOTE_TEMPLATE,
    title: 'Demander un devis commer�ant',
    subtitle: 'Pr�parez votre demande pour un produit, une livraison ou une commande sp�ciale.',
    need_type_label: 'Type de besoin',
    need_type_placeholder: 'Commande, livraison, stock, commande sp�ciale...',
    commune_label: 'Commune de livraison',
    commune_placeholder: 'Noum�a, Pa�ta...',
    requester_phone_label: 'T�l�phone',
    requester_phone_placeholder: 'XX XX XX XX',
    budget_label: 'Budget estim�',
    budget_placeholder: '30000',
    desired_date_label: 'Date de livraison souhait�e',
    desired_date_placeholder: '',
    details_label: 'Quantit�s et pr�cisions',
    details_placeholder: 'Quantit�s, d�lais, produits recherch�s, contraintes...',
    budget_presets: [10000, 30000, 50000],
  },
  service: {
    ...DEFAULT_QUOTE_TEMPLATE,
    title: 'Demander un devis service',
    subtitle: 'Expliquez votre besoin pour obtenir une r�ponse rapide et claire.',
    need_type_label: 'Type de prestation',
    need_type_placeholder: 'Logo, site web, �v�nement, transport...',
    commune_label: 'Commune',
    commune_placeholder: 'Noum�a, Dumb�a...',
    requester_phone_label: 'T�l�phone',
    requester_phone_placeholder: 'XX XX XX XX',
    budget_label: 'Budget projet',
    budget_placeholder: '20000',
    desired_date_label: 'Date souhait�e',
    desired_date_placeholder: '',
    details_label: 'Pr�cisions',
    details_placeholder: "D�crivez le contexte, l'objectif, le d�lai et vos attentes...",
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
