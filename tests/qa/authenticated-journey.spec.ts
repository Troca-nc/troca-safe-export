import { expect, test, type Page } from '@playwright/test'
import { PublishWizardPO } from '../pom/publish-wizard.po'
import {
  dismissOnboardingWizard,
  restoreAuthStore,
} from '../support/auth'

const backendUrl = process.env.PLAYWRIGHT_BACKEND_URL || 'http://127.0.0.1:3001'
const mailpitUrl = process.env.PLAYWRIGHT_MAILPIT_URL || 'http://127.0.0.1:8025'

async function installSession(page: Page, accessToken: string, user: unknown) {
  await restoreAuthStore(page, {
    user,
    isAuthenticated: true,
    demoProfile: null,
  })
  await page.addInitScript((token) => {
    window.sessionStorage.setItem('access_token', token)
    window.sessionStorage.removeItem('refresh_token')
  }, accessToken)
}

async function waitForRegistrationEmails(request: import('@playwright/test').APIRequestContext, email: string) {
  await expect.poll(async () => {
    const response = await request.get(`${mailpitUrl}/api/v1/search`, {
      params: { query: `to:${email}` },
    })
    if (!response.ok()) return 0
    const payload = await response.json() as { total?: number; messages?: unknown[] }
    return Number(payload.total ?? payload.messages?.length ?? 0)
  }, {
    message: `les emails d'inscription destinés à ${email} doivent rester dans Mailpit`,
    timeout: 20_000,
  }).toBeGreaterThanOrEqual(2)
}

async function registerAccount(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  prenom: string,
) {
  const registration = await request.post(`${backendUrl}/api/auth/register`, {
    data: {
      email,
      password: 'QaJourney123!',
      prenom,
      nom: 'QA',
      account_type: 'personal',
    },
  })
  expect(registration.status()).toBe(201)
  const payload = await registration.json() as {
    data?: { access_token?: string; user?: unknown }
  }
  expect(payload.data?.access_token).toBeTruthy()
  expect(payload.data?.user).toBeTruthy()
  return {
    accessToken: payload.data!.access_token!,
    user: payload.data!.user!,
  }
}

test('inscription, publication, recherche et premier contact restent opérationnels', async ({ browser, page, request }) => {
  const suffix = `${Date.now()}-${test.info().retry}`
  const sellerEmail = `qa-seller-${suffix}@example.test`
  const buyerEmail = `qa-buyer-${suffix}@example.test`
  const title = `Vélo QA ${suffix}`
  const contactMessage = `Bonjour, test de contact QA ${suffix}`

  const seller = await registerAccount(request, sellerEmail, 'Camille')
  const buyer = await registerAccount(request, buyerEmail, 'Alex')
  await waitForRegistrationEmails(request, sellerEmail)
  await waitForRegistrationEmails(request, buyerEmail)

  await installSession(page, seller.accessToken, seller.user)
  await page.goto('/')
  await dismissOnboardingWizard(page)

  const wizard = new PublishWizardPO(page)
  await wizard.open()
  await wizard.fillStepOne(title, 'Annonce QA éphémère créée pour valider le parcours métier complet.')
  await wizard.chooseFirstLeafCategory()
  await wizard.goToStep2()
  await wizard.uploadOnePhoto(`qa-${suffix}.png`)
  await wizard.goToStep3()
  await wizard.fillStepThree('19500', 1)
  await wizard.submit()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  const buyerContext = await browser.newContext()
  const buyerPage = await buyerContext.newPage()
  try {
    await installSession(buyerPage, buyer.accessToken, buyer.user)
    await buyerPage.goto('/')
    await dismissOnboardingWizard(buyerPage)

    await buyerPage.goto(`/annonces?q=${encodeURIComponent(title)}`)
    const result = buyerPage.getByRole('link').filter({ hasText: title }).first()
    await expect(result).toBeVisible({ timeout: 20_000 })
    await result.click()
    await expect(buyerPage.getByRole('heading', { name: title })).toBeVisible()

    await buyerPage.getByRole('button', { name: /Contacter le vendeur/i }).click()
    const contactDialog = buyerPage.getByRole('dialog', { name: /Contacter le vendeur/i })
    await contactDialog.getByRole('textbox', { name: /Votre message/i }).fill(contactMessage)
    await contactDialog.getByRole('button', { name: /^Envoyer$/i }).click()
    await expect(buyerPage).toHaveURL(/\/messages\/\d+/, { timeout: 20_000 })
    await expect(buyerPage.getByText(contactMessage)).toBeVisible()
  } finally {
    await buyerContext.close()
  }

  await page.goto('/messages')
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(contactMessage).first()).toBeVisible({ timeout: 20_000 })
})
