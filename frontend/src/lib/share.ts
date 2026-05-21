import { SITE_URL } from '@/types/seo.types'

export type ShareContentKind = 'annonce' | 'profil' | 'content'

export type ShareContent = {
  kind: ShareContentKind
  title: string
  description?: string
  url: string
  imageUrl?: string | null
  itemId?: string | number
}

function safeUrl(value: string) {
  try {
    const parsed = new URL(value, SITE_URL)
    return parsed.origin === new URL(SITE_URL).origin ? parsed.toString() : SITE_URL
  } catch {
    return SITE_URL
  }
}

export function normalizeShareUrl(url: string) {
  const safe = safeUrl(url)
  const parsed = new URL(safe)
  parsed.searchParams.set('utm_source', 'share')
  parsed.searchParams.set('utm_medium', 'social')
  parsed.searchParams.set('utm_campaign', 'troca_share')
  return parsed.toString()
}

export function buildShareText(content: ShareContent) {
  const description = content.description?.trim()
  return description ? `${content.title}\n\n${description}` : content.title
}

export function buildShareMessage(content: ShareContent) {
  return `${buildShareText(content)}\n\n${normalizeShareUrl(content.url)}`
}

export function buildShareUrls(content: ShareContent) {
  const url = normalizeShareUrl(content.url)
  const text = buildShareText(content)
  const message = buildShareMessage(content)

  return {
    url,
    text,
    message,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    messenger: `https://www.messenger.com/share?link=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent(content.title)}&body=${encodeURIComponent(message)}`,
    sms: `sms:?body=${encodeURIComponent(message)}`,
    instagramCaption: message,
  }
}

export function buildShareTrackPayload(content: ShareContent, channel: string) {
  return {
    channel,
    content_type: content.kind,
    item_id: content.itemId != null ? String(content.itemId) : undefined,
  }
}
