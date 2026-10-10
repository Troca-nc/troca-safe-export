import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const authStore = readFileSync(join(root, 'src/store/authStore.ts'), 'utf8')
const header = readFileSync(join(root, 'src/components/layout/HeaderV2.tsx'), 'utf8')

test('guest hydration is deferred until the auth store is initialized', () => {
  const hydration = authStore.slice(authStore.indexOf('onRehydrateStorage:'))

  assert.match(hydration, /queueMicrotask\(\(\) =>/)
  assert.match(hydration, /const state = useAuthStore\.getState\(\)/)
  assert.match(hydration, /finally\s*{\s*state\.setHasHydrated\(true\)/)
  assert.doesNotMatch(hydration, /useAuthStore\.setState\(/)
})

test('invalid or missing real sessions reset without hiding the guest interface', () => {
  assert.match(authStore, /resetAuthState:\s*\(\) => void/)
  assert.match(authStore, /resetAuthState:\s*\(\) => set\(\{ user: null, isAuthenticated: false, demoProfile: null \}\)/)
  assert.match(authStore, /if \(shouldClearRealAuth\)[\s\S]*state\.resetAuthState\(\)/)
})

test('guest navigation exposes login and registration on desktop and in the drawer', () => {
  assert.equal((header.match(/href="\/inscription"/g) ?? []).length, 2)
  assert.equal((header.match(/Créer un compte/g) ?? []).length, 2)
  assert.equal((header.match(/Se connecter/g) ?? []).length, 2)
})

test('the navigation drawer covers tablet widths below xl', () => {
  assert.match(header, /className="ml-auto flex items-center gap-1 xl:hidden"/)
  assert.match(header, /id="header-mobile-menu" className="[^"]*xl:hidden"/)
  assert.match(header, /className="hidden shrink-0 items-center gap-1 border-l border-warm-border pl-3 xl:flex"/)
})
