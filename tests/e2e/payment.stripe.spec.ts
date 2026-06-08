import { expect, test } from '@playwright/test'

import { SubscriptionPO } from '../pom/subscription.po'
import { createConsoleCollector, restoreAuthStore, restoreSessionStorage, storageStatePath } from '../support/auth'
import { fillStripeTestCard } from '../support/stripe'

const STRIPE_E2E_ENABLED = process.env.STRIPE_E2E_ENABLED === 'true'

const PRO_AUTH_STATE = {
  user: {
    id: 'demo-pro',
    email: 'pro@demo.troca.nc',
    first_name: 'Atelier',
    last_name: 'Kalo',
    avatar_url: null,
    is_verified: true,
    is_pro: true,
    is_admin: false,
    rating: 4.9,
    commune_name: 'Dumbea',
    demo_role: 'Compte Pro',
    account_type: 'professional',
  },
  isLoading: false,
  isAuthenticated: true,
  demoProfile: 'pro',
  hasHydrated: true,
}

test.use({ storageState: storageStatePath('pro') })
test.describe.configure({ mode: 'serial' })

test.describe('Stripe checkout', () => {
  test.skip(
    !STRIPE_E2E_ENABLED,
    'Stripe E2E is disabled. Set STRIPE_E2E_ENABLED=true with a real Stripe test backend before running this scenario.'
  )

  test.beforeEach(async ({ page }) => {
    await restoreAuthStore(page, PRO_AUTH_STATE)
    await restoreSessionStorage(page, 'pro')
  })

  test('opens checkout and uses Stripe test card when the tunnel is real', async ({ page }) => {
    const console = createConsoleCollector(page)
    const checkout = new SubscriptionPO(page)

    await checkout.open()
    await checkout.selectStripe()
    await checkout.startSubscription()
    await checkout.expectCheckoutRedirect()

    if (/checkout\.stripe\.com/i.test(page.url())) {
      await fillStripeTestCard(page)
      await checkout.submitStripePayment()
    }

    await expect(page).toHaveURL(/checkout\.stripe\.com|\/paiement\/succes|\/abonnement\/confirmation/i)
    console.assertClean()
  })
})
