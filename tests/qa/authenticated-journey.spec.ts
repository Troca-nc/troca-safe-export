import { expect, test, type Page } from '@playwright/test'
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

async function dismissAuthModal(page: Page) {
  const closeButton = page.getByRole('button', { name: /^Fermer$/i })
  if (await closeButton.count()) {
    await closeButton.first().click()
    await expect(page.getByText(/Connexion rapide|On vous remet au bon endroit/i)).toHaveCount(0)
  }
}

async function publishSale(page: Page, title: string) {
  await page.goto('/deposer?type=sale')
  await dismissAuthModal(page)

  await expect(page.getByRole('heading', { name: /Décrivez votre objet/i })).toBeVisible()
  await page.getByLabel(/^Titre$/i).fill(title)
  await page.getByLabel(/Catégorie/i).selectOption({ label: 'Sports & Loisirs' })
  await page.getByLabel(/Description/i).fill('Annonce QA éphémère créée pour valider le parcours métier complet.')
  await page.getByRole('button', { name: /Continuer/i }).click()

  await expect(page.getByRole('heading', { name: /Ajoutez des photos.*recommandé/i })).toBeVisible()
  await expect(page.getByText(/Recommandé, mais facultatif/i)).toBeVisible()
  await expect(page.locator('input[type="file"]')).toHaveValue('')
  await page.getByRole('button', { name: /Continuer/i }).click()

  await expect(page.getByRole('heading', { name: /Fixez votre prix/i })).toBeVisible()
  await page.getByRole('spinbutton', { name: /Prix/i }).fill('19500')
  await page.getByRole('button', { name: /Continuer/i }).click()

  await expect(page.getByRole('heading', { name: /Où se fait la remise/i })).toBeVisible()
  await page.getByLabel(/Commune/i).selectOption({ index: 1 })
  await page.getByRole('button', { name: /Continuer/i }).click()

  await expect(page.getByRole('heading', { name: /Vérifiez et publiez/i })).toBeVisible()
  await page.getByRole('button', { name: /Publier maintenant/i }).click()
  await expect(page.getByRole('heading', { name: /Votre annonce est en ligne/i })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('link', { name: /Voir la publication/i }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
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
  const responseBody = await registration.text()
  expect(registration.status(), responseBody).toBe(201)
  const payload = JSON.parse(responseBody) as {
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
  const sellerEmail = `qa-seller-${suffix}@example.com`
  const buyerEmail = `qa-buyer-${suffix}@example.com`
  const title = `Vélo QA ${suffix}`
  const contactMessage = `Bonjour, test de contact QA ${suffix}`

  const seller = await registerAccount(request, sellerEmail, 'Camille')
  const buyer = await registerAccount(request, buyerEmail, 'Alex')
  await waitForRegistrationEmails(request, sellerEmail)
  await waitForRegistrationEmails(request, buyerEmail)

  await installSession(page, seller.accessToken, seller.user)
  await page.goto('/')
  await dismissOnboardingWizard(page)

  await publishSale(page, title)

  const buyerContext = await browser.newContext()
  const buyerPage = await buyerContext.newPage()
  let conversationId = ''
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
    await expect(buyerPage).toHaveURL(/\/messages\?conv=\d+/, { timeout: 20_000 })
    conversationId = new URL(buyerPage.url()).searchParams.get('conv') ?? ''
    expect(conversationId).toMatch(/^\d+$/)
    await expect(buyerPage.getByText(contactMessage).first()).toBeVisible()
  } finally {
    await buyerContext.close()
  }

  await page.goto(`/messages?conv=${conversationId}`)
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(contactMessage).first()).toBeVisible({ timeout: 20_000 })
})
