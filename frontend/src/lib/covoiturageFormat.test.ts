import assert from 'node:assert/strict'
import test from 'node:test'

// @ts-expect-error Node's type-stripping test runner requires the explicit extension.
import { formatRideTime, getRideTimestamp } from './covoiturageFormat.ts'

test('formats ride times with French hour notation', () => {
  assert.equal(formatRideTime('07:30:00'), '7 h 30')
  assert.equal(formatRideTime('07:00'), '7 h')
  assert.equal(formatRideTime('invalid'), 'Heure à confirmer')
})

test('sort timestamps use the Noumea offset', () => {
  assert.ok(getRideTimestamp('2027-01-12', '07:30') < getRideTimestamp('2027-01-12', '08:00'))
})
