import { eventsApi, metaApi } from '@/lib/api'
import { demoOr } from '@/lib/demo'
import type {
  EventCategoryOption,
  EventPublishDraft,
  EventPublishMetadata,
  EventPublishResult,
  EventTicketDraft,
  StoredEventDraft,
} from '@/types/events'

export const EVENT_CATEGORIES: readonly EventCategoryOption[] = [
  { value: 'concert', label: 'Concert' },
  { value: 'festival', label: 'Festival' },
  { value: 'sport', label: 'Sport' },
  { value: 'marche', label: 'Marché' },
  { value: 'conference', label: 'Atelier ou conférence' },
  { value: 'exposition', label: 'Exposition' },
  { value: 'cinema', label: 'Cinéma' },
  { value: 'spectacle', label: 'Spectacle' },
  { value: 'autre', label: 'Autre' },
]

export const INITIAL_EVENT_TICKET: EventTicketDraft = {
  name: 'Standard',
  description: '',
  priceXpf: '0',
  quantity: '100',
}

export function createEventPublishDraft(profile?: {
  name?: string
  email?: string
  phone?: string
}): EventPublishDraft {
  return {
    title: '',
    description: '',
    category: '',
    eventDate: '',
    startTime: '19:00',
    endTime: '',
    venueName: '',
    communeId: '',
    venueAddress: '',
    coverImageUrl: '',
    organizerName: profile?.name || '',
    organizerEmail: profile?.email || '',
    organizerPhone: profile?.phone || '',
    websiteUrl: '',
  }
}

function asCommunes(value: unknown): EventPublishMetadata['communes'] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const nestedCommunes = Array.isArray(row.communes) ? row.communes : [row]
    return nestedCommunes.flatMap((commune) => {
      if (!commune || typeof commune !== 'object') return []
      const communeRow = commune as Record<string, unknown>
      const id = Number(communeRow.id)
      const name = String(communeRow.name ?? communeRow.nom ?? communeRow.libelle ?? '').trim()
      return Number.isFinite(id) && name ? [{ id, name }] : []
    })
  })
}

export async function getEventPublishMetadata(): Promise<EventPublishMetadata> {
  return demoOr(
    async () => (await import('@/demo/fixtures/events')).eventPublishMetadataFixture,
    async () => {
      const response = await metaApi.getCommunes()
      const rows = Array.isArray(response.data?.data) ? response.data.data : []
      return { communes: asCommunes(rows) }
    },
  )
}

export function eventDraftStorageKey(userId?: string | null) {
  return `kalico:event-publish-draft:${userId || 'visitor'}`
}

export function loadLocalEventDraft(userId?: string | null): StoredEventDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(eventDraftStorageKey(userId))
    return raw ? JSON.parse(raw) as StoredEventDraft : null
  } catch {
    return null
  }
}

export function saveLocalEventDraft(userId: string | null | undefined, draft: StoredEventDraft) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(eventDraftStorageKey(userId), JSON.stringify(draft))
  }
}

export function clearLocalEventDraft(userId?: string | null) {
  if (typeof window !== 'undefined') window.localStorage.removeItem(eventDraftStorageKey(userId))
}

function integer(value: string) {
  return Number.parseInt(value, 10) || 0
}

export async function publishEvent(
  form: EventPublishDraft,
  ticketing: boolean,
  tickets: EventTicketDraft[],
): Promise<EventPublishResult> {
  return demoOr(
    async () => (await import('@/demo/fixtures/events')).eventPublishResultFixture,
    async () => {
      const prices = ticketing ? tickets.map((ticket) => integer(ticket.priceXpf)) : [0]
      const isFree = !ticketing || prices.every((value) => value === 0)
      const response = await eventsApi.create({
        title: form.title.trim(),
        description: form.description.trim() || null,
        venue_name: form.venueName.trim(),
        venue_address: form.venueAddress.trim() || null,
        commune_id: Number(form.communeId),
        event_date: form.eventDate,
        event_time: form.startTime,
        end_time: form.endTime || null,
        cover_image_url: form.coverImageUrl.trim() || null,
        photos: form.coverImageUrl.trim() ? [form.coverImageUrl.trim()] : [],
        category: form.category,
        status: 'published',
        has_ticketing: ticketing,
        max_capacity: ticketing
          ? tickets.reduce((sum, ticket) => sum + integer(ticket.quantity), 0)
          : null,
        is_free: isFree,
        organizer_name: form.organizerName.trim(),
        organizer_email: form.organizerEmail.trim(),
        organizer_phone: form.organizerPhone.trim() || null,
        website_url: form.websiteUrl.trim() || null,
        target_audience: 'particulier',
        kind: form.category === 'concert' ? 'concert' : 'event',
        price_xpf: prices.length ? Math.min(...prices) : 0,
        ticket_types: ticketing
          ? tickets.map((ticket, index) => ({
              name: ticket.name.trim(),
              description: ticket.description.trim() || null,
              price_xpf: integer(ticket.priceXpf),
              quantity_total: integer(ticket.quantity),
              is_active: true,
              position: index,
            }))
          : [],
      })
      const id = String(response.data?.data?.id ?? '')
      if (!id) throw new Error('Le serveur n’a pas retourné l’identifiant de l’événement.')
      return { id, href: `/evenements/${id}` }
    },
  )
}
