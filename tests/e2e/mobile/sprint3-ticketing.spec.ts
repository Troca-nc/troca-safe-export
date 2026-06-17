import { expect, test } from '@playwright/test'
import {
  MOBILE_VIEWPORTS,
  createMobileConsoleCollector,
  expectMobileBodyHealthy,
  hydrateAuthenticatedMobilePage,
  openMobilePage,
  saveMobileScreenshot,
  setMobileViewport,
} from './helpers'

type TicketedEvent = {
  id: string
  title: string
  ticketTypeId: number
  ticketName: string
}

async function findFreeTicketedEvent(page: import('@playwright/test').Page): Promise<TicketedEvent | null> {
  return page.evaluate(async () => {
    const response = await fetch('/api/events?limit=48&category=concert,festival,sport,marche,conference,exposition,cinema,spectacle,autre')
    const payload = await response.json().catch(() => null)
    const events = Array.isArray(payload?.data) ? payload.data : []
    const pickTicket = (event: any) => (Array.isArray(event?.ticket_types) ? event.ticket_types.find((ticket: any) => Number(ticket?.remaining ?? 0) > 0) : null)
    const match =
      events.find((event: any) => Boolean(event?.has_ticketing) && Boolean(event?.is_free) && pickTicket(event)) ||
      events.find((event: any) => Boolean(event?.has_ticketing) && pickTicket(event))
    const ticket = match ? pickTicket(match) : null
    if (!match || !ticket) return null
    return {
      id: String(match.id),
      title: String(match.title || ''),
      ticketTypeId: Number(ticket.id),
      ticketName: String(ticket.name || ''),
    } satisfies TicketedEvent
  })
}

test.describe.configure({ mode: 'serial' })

for (const viewport of MOBILE_VIEWPORTS) {
  test(`ticket reservation and scanner work on ${viewport.label}`, async ({ page }) => {
    test.setTimeout(20_000)
    const console = createMobileConsoleCollector(page)

    await setMobileViewport(page, viewport.width, viewport.height)
    await hydrateAuthenticatedMobilePage(page, 'particulier')

    await openMobilePage(page, '/evenements')
    const event = await findFreeTicketedEvent(page)
    if (!event) {
      globalThis.console.warn(`[mobile-audit] Aucun événement gratuit avec billetterie trouvé pour ${viewport.label}; parcours réservation non exécuté.`)
      await expect(page.getByText(/Agenda Kalico/i)).toBeVisible()
      await expect(page.getByRole('link', { name: /Scanner un billet/i })).toBeVisible()
      await expectMobileBodyHealthy(page)
      await saveMobileScreenshot(page, `sprint3-evenements-no-ticketing-${viewport.width}`)
      console.assertClean()
      return
    }

    await openMobilePage(page, `/evenements/${event.id}`)
    await expect(page.getByRole('heading', { name: event.title })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /Choisissez vos billets/i })).toBeVisible()
    await expect(page.getByText(/Réservation temporaire 10 minutes/i)).toBeVisible()

    await page.getByLabel('Nom').fill('Emma Martin')
    await page.getByLabel('Email').fill('particulier@demo.kalico')
    await page.getByLabel('Téléphone').fill('+687700001')

    const reservationResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/events/${event.id}/reservations`) &&
        response.request().method() === 'POST' &&
        response.status() === 200,
    )
    await page.getByRole('button', { name: /Réserver mes billets/i }).click()
    const reservation = await reservationResponse
    const reservationJson = await reservation.json()
    const ticketToken = reservationJson?.data?.tickets?.[0]?.token

    expect(ticketToken, 'ticket token').toBeTruthy()
    await expect(page.getByText(/Commande confirmée|Billet validé avec succès/i)).toBeVisible({ timeout: 15_000 })
    await expectMobileBodyHealthy(page)

    await hydrateAuthenticatedMobilePage(page, 'pro')
    await openMobilePage(page, `/scan/${ticketToken}`)
    await expect(page.getByRole('heading', { name: /Validation de billet/i })).toBeVisible()
    await page.getByPlaceholder(/Entrée principale/i).fill('Entrée principale')

    const scanResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/events/tickets/${ticketToken}/scan`) &&
        response.request().method() === 'POST' &&
        response.status() === 200,
    )
    await page.getByRole('button', { name: /Marquer comme utilisé/i }).click()
    await scanResponse
    await expect(page.getByText(/Billet validé avec succès/i)).toBeVisible({ timeout: 15_000 })
    await expectMobileBodyHealthy(page)
    await saveMobileScreenshot(page, `sprint3-scan-${viewport.width}`)

    console.assertClean()
  })
}
