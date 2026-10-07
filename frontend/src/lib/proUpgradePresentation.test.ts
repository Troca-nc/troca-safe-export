import assert from 'node:assert/strict'
import test from 'node:test'

// @ts-expect-error Node utilise l'extension explicite pour le type stripping.
import { formatRidet, normalizeRidet, validateProUpgradeDraft } from './proUpgradePresentation.ts'
import type { ProUpgradeDraft } from '@/types/pro-upgrade'

const validDraft: ProUpgradeDraft = {
  companyName: 'Atelier local',
  sector: 'Artisan BTP',
  phone: '75 00 00',
  ridet: '1234567890',
  commune: 'Nouméa',
  presentation: 'Une présentation suffisamment précise.',
  selectedPlanId: 'pro',
  billingCycle: 'monthly',
}

test('normalise et formate un RIDET sur dix chiffres', () => {
  assert.equal(normalizeRidet('123 456 7.890'), '1234567890')
  assert.equal(formatRidet('1234567890'), '1234567 890')
})

test('accepte un dossier complet', () => {
  assert.deepEqual(validateProUpgradeDraft(validDraft), {})
})

test('signale les champs métier manquants', () => {
  const errors = validateProUpgradeDraft({ ...validDraft, ridet: '123', commune: '', presentation: 'Court' })
  assert.ok(errors.ridet)
  assert.ok(errors.commune)
  assert.ok(errors.presentation)
})
