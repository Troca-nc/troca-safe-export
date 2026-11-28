import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const configProbe = `
  const config = require('./next.config.js')
  Promise.resolve(config.rewrites()).then((rewrites) => {
    process.stdout.write(JSON.stringify(rewrites))
  })
`

function probe(overrides = {}) {
  const env = { ...process.env }
  delete env.NEXT_PUBLIC_API_PROXY_TARGET
  delete env.KALICO_TEST_API_PROXY_TARGET
  delete env.KALICO_BUILD_PROFILE

  return spawnSync(process.execPath, ['-e', configProbe], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    env: { ...env, NODE_ENV: 'production', ...overrides },
  })
}

test('a production build has no API rewrite by default', () => {
  const result = probe()
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [])
})

test('the legacy public proxy variable always fails the build', () => {
  const result = probe({ NEXT_PUBLIC_API_PROXY_TARGET: 'http://127.0.0.1:3001' })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /NEXT_PUBLIC_API_PROXY_TARGET is forbidden/)
})

test('the test proxy target fails outside the explicit test profile', () => {
  const result = probe({ KALICO_TEST_API_PROXY_TARGET: 'http://127.0.0.1:3001' })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /allowed only with KALICO_BUILD_PROFILE=test/)
})

test('the isolated test profile enables only the expected rewrite', () => {
  const result = probe({
    KALICO_BUILD_PROFILE: 'test',
    KALICO_TEST_API_PROXY_TARGET: 'http://127.0.0.1:3001/',
  })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [
    { source: '/api/:path*', destination: 'http://127.0.0.1:3001/api/:path*' },
  ])
})
