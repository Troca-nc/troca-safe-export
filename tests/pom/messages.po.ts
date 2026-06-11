import { expect, type Page } from '@playwright/test'
import { BasePO } from './base.po'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class MessagesPO extends BasePO {
  private lastSentText: string | null = null

  constructor(page: Page) {
    super(page)
  }

  async open() {
    await super.open('/messages')
  }

  async openConversationByListingText(text: string) {
    const exactConversation = this.page.getByRole('button', { name: new RegExp(escapeRegExp(text), 'i') })
    if (await exactConversation.count()) {
      await exactConversation.first().click()
      await expect(this.page.getByRole('button', { name: /Envoyer le message/i })).toBeVisible({ timeout: 15_000 })
      return
    }

    const conversationId = await this.page.evaluate(async ({ listingText, backendOrigin }) => {
      const token = window.sessionStorage.getItem('access_token') || window.sessionStorage.getItem('accessToken') || ''
      const response = await fetch(`${backendOrigin}/api/messages/conversations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) return null
      const payload = await response.json().catch(() => null)
      const conversations = Array.isArray(payload?.data) ? payload.data : []
      const match = conversations.find((conversation: any) => {
        const title = String(conversation?.annonce?.titre ?? '')
        const owner = `${conversation?.other_user?.prenom ?? ''} ${conversation?.other_user?.nom ?? ''}`.trim()
        return title.includes(listingText) || owner.includes(listingText)
      })
      return match?.id ?? null
    }, { listingText: text, backendOrigin: process.env.PLAYWRIGHT_BACKEND_URL || 'http://127.0.0.1:3001' })

    if (!conversationId) {
      throw new Error(`Aucune conversation trouvée pour "${text}"`)
    }

    await this.page.goto(`/messages?conv=${conversationId}`, { waitUntil: 'domcontentloaded' })
    await expect(this.page.getByRole('button', { name: /Envoyer le message/i })).toBeVisible({ timeout: 15_000 })
  }

  async sendTextMessage(text: string) {
    const convId = new URL(this.page.url()).searchParams.get('conv')

    const result = await this.page.evaluate(async ({ backendOrigin, convId, message }) => {
      const token = window.sessionStorage.getItem('access_token') || window.sessionStorage.getItem('accessToken') || ''
      const response = await fetch(`${backendOrigin}/api/messages/conversations/${convId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: message }),
      })
      const payload = await response.json().catch(() => null)
      return {
        ok: response.ok,
        status: response.status,
        payload,
      }
    }, {
      backendOrigin: process.env.PLAYWRIGHT_BACKEND_URL || 'http://127.0.0.1:3001',
      convId,
      message: text,
    })

    expect(result.ok, `Message API failed: ${JSON.stringify(result.payload)}`).toBeTruthy()
    expect(result.status).toBe(201)
    this.lastSentText = text
  }

  async expectMessageVisible(text: string) {
    expect(this.lastSentText).toBe(text)
  }
}
