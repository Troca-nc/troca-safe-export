import { expect, test } from '@playwright/test'

const knownPrivatePaths = [
  '/uploads/chat/security-a/security-document.pdf',
  '/uploads/chat/security-a/security-photo.webp',
  '/uploads/chat/security-a/security-audio.webm',
  '/uploads/pro-documents/security-pro-a/security-ridet.pdf',
  '/uploads/imports/security-import.csv',
  '/uploads/qr-tickets/security-ticket-paid.png',
]

test('security harness reaches the real backend through nginx', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body.service).toBe('kalico-backend')
})

for (const pathname of knownPrivatePaths) {
  test(`known exposure is reproducible for ${pathname.split('/')[2]}`, async ({ request }) => {
    const response = await request.get(pathname)
    expect(response.status()).toBe(200)
    expect(response.headers()['cache-control'] || '').toContain('public')
    expect(await response.text()).toContain('KALICO_TEST_ONLY')
  })
}

test('public listing image remains available through its database identifier', async ({ request }) => {
  const response = await request.get('/uploads/1')
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain('KALICO_TEST_ONLY')
})

test('unknown public image identifier returns 404', async ({ request }) => {
  const response = await request.get('/uploads/999999')
  expect(response.status()).toBe(404)
})

test('query canary is sent only as synthetic characterization data', async ({ request }) => {
  const response = await request.get('/api/health?token=KALICO_CANARY_QUERY_TEST_ONLY')
  expect(response.ok()).toBeTruthy()
})
