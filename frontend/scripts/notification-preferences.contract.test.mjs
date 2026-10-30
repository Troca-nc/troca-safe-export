import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const page = readFileSync(new URL('../src/app/parametres/notifications/page.tsx', import.meta.url), 'utf8')
const data = readFileSync(new URL('../src/lib/data/notifications.ts', import.meta.url), 'utf8')
const controls = readFileSync(new URL('../src/components/ui/Controls.tsx', import.meta.url), 'utf8')

const preferenceKeys = [
  'email_new_message',
  'push_new_message',
  'email_search_alert',
  'push_search_alert',
  'email_boost_activated',
  'email_offer_received',
  'email_listing_expiring',
  'email_listing_expired',
  'email_performance_report',
  'push_performance_report',
  'performance_report_frequency',
  'notify_all',
  'notify_categories',
  'notify_businesses',
  'via_push',
  'via_email',
]

test('preserves every notification preference exposed by the existing APIs', () => {
  preferenceKeys.forEach((key) => assert.match(data, new RegExp(`\\b${key}\\b`)))
  assert.match(data, /notificationsApi\.getPreferences\(\)/)
  assert.match(data, /bonPlansApi\.getPrefs\(\)/)
})

test('keeps remote writes behind the single explicit save action', () => {
  assert.doesNotMatch(page, /from '@\/lib\/api'/)
  assert.match(page, /saveNotificationPreferences\(draft, demoProfile\)/)
  assert.match(data, /Promise\.all\(\[/)
  assert.match(page, /beforeunload/)
})

test('keeps account-specific report frequencies and accessible controls', () => {
  assert.match(page, /isPro \? \[/)
  assert.match(page, /value: 'daily'/)
  assert.match(page, /value: 'monthly'/)
  assert.match(page, /value: 'weekly'/)
  assert.match(page, /value: 'never'/)
  assert.match(controls, /role=\{kind === 'switch' \? 'switch'/)
  assert.match(controls, /aria-pressed=\{selected\}/)
})
