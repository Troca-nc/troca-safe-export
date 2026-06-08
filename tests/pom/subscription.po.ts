import { expect } from '@playwright/test'

import { BasePO } from './base.po'

export class SubscriptionPO extends BasePO {
  async open() {
    await super.open('/abonnement')
  }

  async selectStripe() {
    await this.page.getByRole('radio', { name: /carte bancaire internationale/i }).click()
  }

  async startSubscription() {
    const button = this.page.getByRole('button', { name: /commencer l'essai gratuit 14 jours/i })
    await expect(button).toBeVisible()
    await button.click()
  }

  async expectCheckoutRedirect() {
    await expect(this.page).toHaveURL(/checkout\.stripe\.com|\/paiement\/succes|\/abonnement\/confirmation/i)
  }

  async submitStripePayment() {
    const payButton = this.page.getByRole('button', { name: /^(payer|pay|confirmer|s'abonner|subscribe)/i }).first()
    await expect(payButton).toBeVisible()
    await payButton.click()
  }
}
