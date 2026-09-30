import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

const source = join(dirname(fileURLToPath(import.meta.url)), 'check-design.mjs')
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'kalico-design-check-'))
  // Only the exact freshly created directory is removed, never a repository checkout.
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const git = (...args) =>
    execFileSync('git', args, { cwd: dir, stdio: 'pipe' })
  const put = (name, body) => {
    const file = join(dir, 'frontend', name)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, body)
  }
  git('init', '-b', 'main')
  git('config', 'user.name', 'Design test')
  git('config', 'user.email', 'design-test@example.invalid')
  put('src/components/ui/Existing.tsx', 'export const existing = "text-ink";\n')
  put('scripts/placeholder', '')
  copyFileSync(source, join(dir, 'frontend/scripts/check-design.mjs'))
  git('add', '.')
  git('commit', '-m', 'base')
  git('update-ref', 'refs/remotes/origin/main', 'HEAD')
  git('switch', '-c', 'change')
  const run = (...args) =>
    spawnSync(
      process.execPath,
      [resolve(dir, 'frontend/scripts/check-design.mjs'), ...args],
      { cwd: join(dir, 'frontend'), encoding: 'utf8' },
    )
  return { dir, git, put, run }
}
test('detects unstaged and staged tracked edits from frontend/', (t) => {
  const f = fixture(t)
  f.put(
    'src/components/ui/Existing.tsx',
    'export const existing = "bg-white";\n',
  )
  assert.equal(
    f.run('--changed').status,
    1,
    f.run('--changed').stdout + f.run('--changed').stderr,
  )
  f.git('add', '.')
  assert.equal(
    f.run('--changed').status,
    1,
    f.run('--changed').stdout + f.run('--changed').stderr,
  )
})
test('detects untracked files and normalizes monorepo paths', (t) => {
  const f = fixture(t)
  f.put('src/components/ui/New.tsx', 'export const color = "#aabbcc";\n')
  const result = f.run('--changed')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /src\/components\/ui\/New.tsx/)
})
test('distinguishes demo components from fixtures including dynamic imports', (t) => {
  const f = fixture(t)
  f.put(
    'src/components/ui/New.tsx',
    "import { DemoRibbon } from '@/components/demo/DemoRibbon';\n",
  )
  assert.equal(f.run('--changed').status, 0)
  f.put(
    'src/components/ui/New.tsx',
    "const fixtures = import('@/demo/fixtures/listings');\n",
  )
  assert.equal(
    f.run('--changed').status,
    1,
    f.run('--changed').stdout + f.run('--changed').stderr,
  )
  f.put(
    'src/components/ui/New.tsx',
    "import fixtures from '../../demo/fixtures/listings';\n",
  )
  assert.equal(
    f.run('--changed').status,
    1,
    f.run('--changed').stdout + f.run('--changed').stderr,
  )
  f.put('src/components/ui/New.tsx', 'export const label = "text-ink";\n')
  f.put(
    'src/lib/data/listings.ts',
    "const fixtures = import('@/demo/fixtures/listings');\n",
  )
  assert.equal(f.run('--changed').status, 0)
})
test('tokens are exempt, deleted files are ignored, and empty scope is explicit', (t) => {
  const f = fixture(t)
  f.put('src/styles/kalico-tokens.css', ':root { --color-bg: #ffffff; }\n')
  assert.equal(f.run('--changed').status, 0)
  f.git('add', '.')
  f.git('commit', '-m', 'tokens')
  f.git('update-ref', 'refs/remotes/origin/main', 'HEAD')
  f.git('rm', 'frontend/src/components/ui/Existing.tsx')
  const result = f.run('--changed')
  assert.equal(result.status, 0)
  assert.match(result.stdout, /Aucun fichier source/)
})
test('launch refuses provisional values and demo in production overrides', (t) => {
  const f = fixture(t)
  f.put(
    'src/content/placeholders.ts',
    'export const count = { provisional: true };\n',
  )
  assert.equal(f.run('--launch').status, 1)
  f.put(
    'src/content/placeholders.ts',
    'export const count = { provisional: false };\n',
  )
  f.put('.env.production.local', 'NEXT_PUBLIC_DEMO_DATA=true\n')
  assert.equal(f.run('--launch').status, 1)
  f.put('.env.production.local', 'NEXT_PUBLIC_DEMO_DATA=false\n')
  assert.equal(f.run('--launch').status, 0)
})
