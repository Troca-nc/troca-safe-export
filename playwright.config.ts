import { defineConfig, devices } from '@playwright/test'
import { storageStatePath } from './tests/support/auth'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'
const isExternalUrl = /^https?:\/\//i.test(baseURL) && !/^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?/i.test(baseURL)
const desktop = { ...devices['Desktop Chrome'] }
const iPhone13 = { ...devices['iPhone 13'] }
const samsungGalaxyS22 = {
  viewport: { width: 360, height: 780 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
}
const authState = (role: 'particulier' | 'vendeur' | 'pro' | 'conducteur' | 'admin') => storageStatePath(role)
const useLocalWebServer = process.env.PLAYWRIGHT_USE_LOCAL_SERVER !== 'false' && !isExternalUrl
const visualProjects = [
  {
    name: 'Desktop Chrome',
    testMatch: /visual\/.*\.spec\.ts$/,
    use: { ...desktop },
  },
  {
    name: 'iPhone 13',
    testMatch: /visual\/.*\.spec\.ts$/,
    use: { ...iPhone13 },
  },
  {
    name: 'Samsung Galaxy S22',
    testMatch: /visual\/.*\.spec\.ts$/,
    use: { ...samsungGalaxyS22 },
  },
] as const

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  globalSetup: './tests/global-setup',
  globalTeardown: './tests/global-teardown',
  reporter: [
    ['line'],
    ['html', { open: 'never' }],
    ['./tests/reporters/consolidated-report'],
  ],
  outputDir: 'test-results',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
  },
  projects: [
    ...visualProjects,
    {
      name: 'smoke',
      testMatch: /smoke\/.*\.spec\.ts$/,
      use: {
        ...desktop,
      },
    },
    {
      name: 'public',
      testMatch: /public\.spec\.ts$/,
      use: {
        ...desktop,
      },
    },
    {
      name: 'particulier',
      testMatch: /particulier\.spec\.ts$/,
      use: {
        ...desktop,
        storageState: authState('particulier'),
      },
    },
    {
      name: 'vendeur',
      testMatch: /vendeur\.spec\.ts$/,
      use: {
        ...desktop,
        storageState: authState('vendeur'),
      },
    },
    {
      name: 'pro',
      testMatch: /pro\.spec\.ts$/,
      use: {
        ...desktop,
        storageState: authState('pro'),
      },
    },
    {
      name: 'conducteur',
      testMatch: /conducteur\.spec\.ts$/,
      use: {
        ...desktop,
        storageState: authState('conducteur'),
      },
    },
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts$/,
      use: {
        ...desktop,
        storageState: authState('admin'),
      },
    },
  ],
})
