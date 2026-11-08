import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const header = readFileSync(new URL('../src/components/layout/Header.tsx', import.meta.url), 'utf8')

test('détecte un build Next plus récent sans perturber la navigation', () => {
  assert.match(header, /extractKalicoBuildId/)
  assert.match(header, /fetch\(`\/\?_kalico_build_check=\$\{Date\.now\(\)\}`/)
  assert.match(header, /cache: 'no-store'/)
  assert.match(header, /document\.visibilityState === 'visible'/)
  assert.match(header, /window\.addEventListener\('focus'/)
  assert.match(header, /BUILD_CHECK_INTERVAL_MS/)
  assert.match(header, /catch \{[\s\S]*?ne doit jamais perturber la navigation/)
})

test('demande une actualisation explicite et force un nouveau document', () => {
  assert.match(header, /Une nouvelle version de Kalico est disponible/)
  assert.match(header, />\s*Actualiser\s*</)
  assert.match(header, /searchParams\.set\('_kalico_refresh'/)
  assert.match(header, /window\.location\.assign/)
  assert.doesNotMatch(header, /window\.location\.reload/)
})
