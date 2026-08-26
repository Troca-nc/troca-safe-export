import { defineConfig } from '@playwright/test'

const baseURL = process.env.SECURITY_BASE_URL || `http://127.0.0.1:${process.env.SECURITY_NGINX_PORT || '18080'}`

export default defineConfig({
  testDir: './tests/security-boundary',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['line']],
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    extraHTTPHeaders: { 'x-kalico-security-test': 'KALICO_TEST_ONLY' },
  },
})
