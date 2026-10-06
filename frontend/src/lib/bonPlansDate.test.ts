import assert from 'node:assert/strict'
import test from 'node:test'

// @ts-expect-error Node's type-stripping test runner requires the explicit extension.
import { formatNoumeaDate, getNoumeaDayKey, isExpiredBonPlan, isPastEvent } from './bonPlansDate.ts'

test('uses the Pacific/Noumea calendar day', () => {
  assert.equal(getNoumeaDayKey('2026-10-05T14:30:00.000Z'), '2026-10-06')
  assert.match(formatNoumeaDate('2026-10-05T14:30:00.000Z'), /6 octobre/i)
})

test('removes an offer exactly when its publication expires', () => {
  const now = Date.parse('2026-10-06T00:00:00.000Z')
  assert.equal(isExpiredBonPlan('2026-10-06T00:00:00.000Z', now), true)
  assert.equal(isExpiredBonPlan('2026-10-06T00:00:01.000Z', now), false)
})

test('keeps events for the current Noumea day', () => {
  const now = Date.parse('2026-10-05T14:30:00.000Z')
  assert.equal(isPastEvent('2026-10-05', now), true)
  assert.equal(isPastEvent('2026-10-06', now), false)
})
