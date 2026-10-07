import type { ProUpgradeDraft, ProUpgradeFieldErrors } from '@/types/pro-upgrade'

export function normalizeRidet(value: string) {
  return value.replace(/\D/g, '').slice(0, 10)
}

export function formatRidet(value: string) {
  const digits = normalizeRidet(value)
  if (digits.length <= 7) return digits.replace(/^(\d{1,7})(\d{0,3})$/, '$1 $2').trim()
  return `${digits.slice(0, 7)} ${digits.slice(7)}`
}

export function validateProUpgradeDraft(draft: ProUpgradeDraft): ProUpgradeFieldErrors {
  const errors: ProUpgradeFieldErrors = {}
  if (draft.companyName.trim().length < 2) errors.companyName = 'Indiquez la raison sociale de votre entreprise.'
  if (!draft.sector) errors.sector = 'Choisissez votre secteur d’activité.'
  if (draft.phone.replace(/\D/g, '').length < 6) errors.phone = 'Indiquez un numéro de téléphone valide.'
  if (normalizeRidet(draft.ridet).length !== 10) errors.ridet = 'Le RIDET doit contenir exactement 10 chiffres.'
  if (!draft.commune) errors.commune = 'Choisissez votre commune principale.'
  if (draft.presentation.trim().length < 10) errors.presentation = 'Présentez votre activité en au moins 10 caractères.'
  if (draft.presentation.trim().length > 300) errors.presentation = 'La présentation ne peut pas dépasser 300 caractères.'
  return errors
}

export function isProUpgradeDraftValid(draft: ProUpgradeDraft) {
  return Object.keys(validateProUpgradeDraft(draft)).length === 0
}
