import { expect, type Page } from '@playwright/test'

const STRIPE_TEXT_FIELDS: Array<{ label: RegExp; value: string }> = [
  { label: /email/i, value: process.env.STRIPE_TEST_EMAIL || 'qa@kalico.nc' },
  { label: /card number|numero de carte|num[ée]ro de carte/i, value: '4242 4242 4242 4242' },
  { label: /expiration|expiry/i, value: '12 / 34' },
  { label: /cvc|cvv|security code/i, value: '123' },
  { label: /postal|zip|code postal/i, value: '98800' },
]

async function fillInFrame(frame: import('@playwright/test').Frame, label: RegExp, value: string) {
  const byLabel = frame.getByLabel(label).first()
  if (await byLabel.count()) {
    await byLabel.fill(value)
    return true
  }

  const candidates = [
    'input[autocomplete="email"]',
    'input[autocomplete="cc-number"]',
    'input[autocomplete="cc-exp"]',
    'input[autocomplete="cc-csc"]',
    'input[autocomplete="postal-code"]',
    'input[name="cardnumber"]',
    'input[name="exp-date"]',
    'input[name="cvc"]',
    'input[name="postal"]',
  ]

  for (const selector of candidates) {
    const locator = frame.locator(selector).first()
    if (await locator.count()) {
      await locator.fill(value)
      return true
    }
  }

  return false
}

export async function fillStripeTestCard(page: Page) {
  const frames = [page.mainFrame(), ...page.frames().filter((frame) => frame !== page.mainFrame())]

  for (const { label, value } of STRIPE_TEXT_FIELDS) {
    let filled = false
    for (const frame of frames) {
      try {
        filled = await fillInFrame(frame, label, value)
        if (filled) break
      } catch {
        // Try next frame.
      }
    }
    if (!filled) {
      // Non bloquant: le checkout Stripe peut presenter une UI differente selon le mode.
      continue
    }
  }

  const payButtonCandidates = [
    /^(payer|pay|confirmer|continue|submit|s'abonner|subscribe)/i,
    /payer maintenant/i,
    /finaliser/i,
  ]

  for (const candidate of payButtonCandidates) {
    const button = page.getByRole('button', { name: candidate }).first()
    if (await button.count()) {
      await expect(button).toBeVisible()
      await button.click()
      return
    }
  }
}
