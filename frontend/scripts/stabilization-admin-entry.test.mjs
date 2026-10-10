import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const adminEntry = readFileSync(join(root, 'src/app/admin/page.tsx'), 'utf8')
const unavailable = readFileSync(join(root, 'src/components/admin/LegacyAdminUnavailable.tsx'), 'utf8')

test('the legacy /admin entry renders the explicit unavailable state', () => {
  assert.match(adminEntry, /import \{ LegacyAdminUnavailable \}/)
  assert.match(adminEntry, /return <LegacyAdminUnavailable \/>/)
})

test('the unavailable state stays truthful and does not expose admin actions', () => {
  assert.match(unavailable, /Administration indisponible/)
  assert.match(unavailable, /Aucune action administrative ne peut être effectuée/)
  assert.doesNotMatch(adminEntry, /Api|fetch\(|useEffect|useAuthStore/)
})
