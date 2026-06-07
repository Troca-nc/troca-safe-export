import { defineConfig, devices } from '@playwright/test'
import { storageStatePath } from './tests/support/auth'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'
const desktop = { ...devices['Desktop Chrome'] }
const authState = (role: 'particulier' | 'vendeur' | 'pro' | 'conducteur' | 'admin') => storageStatePath(role)

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
  },
  projects: [
    {
      name: 'public',
      testMatch: /public\.spec\.ts$/,
      use: {
        ...desktop,
      },
    },
    {
      name: 'particulier',
      testMatch: /particulier\.spec\.ts$|mobile\.spec\.ts$/,
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
      testMatch: /pro\.spec\.ts$|mobile\.spec\.ts$/,
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
