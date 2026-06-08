import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector, restoreSessionStorage } from './support/auth'
import { captureFullPage, expectMainHeadingVisible, expectNotOnConnexion, expectPageHealthy, gotoPage } from './support/audit'
import { ProPO } from './pom/pro.po'

test.describe('pro', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSessionStorage(page, 'pro')
  })

  test('dashboard main exposes KPIs, trust score and onboarding', async ({ page }) => {
    const console = createConsoleCollector(page)
    const pro = new ProPO(page)

    await pro.openDashboard()
    await expectNotOnConnexion(page)
    await expectMainHeadingVisible(page)
    await pro.expectDashboardLoaded()
    await expect(page.getByText(/Annonces actives/i)).toBeVisible()
    await expect(page.getByText(/Utilisateurs inscrits/i)).toBeVisible()
    await expect(page.getByText(/Signalements en attente/i)).toBeVisible()
    await expect(page.getByText(/Messages échangés/i).or(page.getByText(/Messages echanges/i))).toBeVisible()
    await expect(page.getByText(/Score/i)).toBeVisible()
    await expect(page.getByText(/Pack lancement/i)).toBeVisible()
    await captureFullPage(page, 'pro', 'dashboard')

    await pro.openRdv()
    await expect(page.getByText(/Rendez-vous en ligne/i)).toBeVisible()
    await expect(page.getByText(/Créneaux publiés/i).or(page.getByText(/Creneaux publies/i))).toBeVisible()
    await expect(page.getByText(/Votre timeline du jour/i)).toBeVisible()
    await expect(page.getByText(/Prochain rappel/i)).toBeVisible()
    await expect(page.getByText(/Indisponibilités/i).or(page.getByText(/Indisponibilites/i))).toBeVisible()
    await captureFullPage(page, 'pro', 'rdv')

    await pro.openDevis()
    await expect(page.getByRole('button', { name: /Nouveau devis/i })).toBeVisible()
    await page.getByRole('button', { name: /Nouveau devis/i }).click()
    await expect(page.getByText(/Nouveau devis pour Entreprise Test NC/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Ajouter une ligne/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Sauvegarder brouillon/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Envoyer le devis/i })).toBeVisible()
    await captureFullPage(page, 'pro', 'devis')

    await pro.openCatalogue()
    await expect(page.getByText(/Catalogue produits/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Ajouter un produit/i })).toBeVisible()
    await expect(page.getByText(/Aperçu en direct/i)).toBeVisible()
    await captureFullPage(page, 'pro', 'catalogue')

    await gotoPage(page, '/pro/dashboard/parrainage')
    await expect(page.getByText(/PW-PRO-2026/i)).toBeVisible()
    await expect(page.getByText(/WhatsApp/i)).toBeVisible()
    await expect(page.getByText(/Email/i)).toBeVisible()
    await expect(page.getByText(/SMS/i)).toBeVisible()
    await captureFullPage(page, 'pro', 'parrainage')

    await gotoPage(page, '/pro/dashboard/auto-reply')
    await expect(page.getByText(/Réponse automatique/i).or(page.getByText(/Reponse automatique/i))).toBeVisible()
    await expect(page.getByRole('textbox').first()).toBeVisible()
    await captureFullPage(page, 'pro', 'auto-reply')

    await pro.openPack()
    await expect(page.getByText(/Checklist/i).or(page.getByText(/étapes/i)).or(page.getByText(/etapes/i))).toBeVisible()
    await expect(page.getByText(/Compléter le profil/i).or(page.getByText(/Completer le profil/i))).toBeVisible()
    await expect(page.getByText(/Publier une annonce/i)).toBeVisible()
    await expect(page.getByText(/Créer le catalogue/i).or(page.getByText(/Creer le catalogue/i))).toBeVisible()
    await expect(page.getByText(/Activer les rendez-vous/i)).toBeVisible()
    await expect(page.getByText(/Envoyer un devis/i)).toBeVisible()
    await captureFullPage(page, 'pro', 'pack-lancement')

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('public pro storefront can be found from the directory', async ({ page }) => {
    const console = createConsoleCollector(page)

    await gotoPage(page, '/pros')
    await page.getByPlaceholder(/Nom, entreprise, spécialité/i).fill('Entreprise Test NC')
    await expect(page.getByText('Entreprise Test NC').first()).toBeVisible()
    await page.getByText('Entreprise Test NC').first().click()
    await expect(page.getByText(/Annonces/i)).toBeVisible()
    await expect(page.getByText(/Catalogue/i)).toBeVisible()
    await expect(page.getByText(/Avis/i)).toBeVisible()
    await expect(page.getByText(/À propos/i).or(page.getByText(/A propos/i))).toBeVisible()
    await expect(page.getByText(/Prendre rendez-vous/i).or(page.getByText(/Rendez-vous/i))).toBeVisible()
    await captureFullPage(page, 'pro', 'storefront')

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
