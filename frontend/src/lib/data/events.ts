import { eventsApi, metaApi, uploadApi } from '@/lib/api'
import { demoOr } from '@/lib/demo'
import type {
  EventCategoryOption,
  EventAdmissionMode,
  ManagedEventDraft,
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
    photoUrls: [],
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
    if (!raw) return null
    const stored = JSON.parse(raw) as StoredEventDraft
    const coverImageUrl = String(stored.form?.coverImageUrl || '')
    return {
      ...stored,
      form: {
        ...stored.form,
        coverImageUrl,
        photoUrls: normalizeEventPhotoUrls(stored.form?.photoUrls, coverImageUrl),
      },
    }
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

export function normalizeEventPhotoUrls(value: unknown, coverImageUrl = '') {
  const rows = Array.isArray(value) ? value : []
  const urls = [coverImageUrl, ...rows]
    .map((item) => String(item || '').trim())
    .filter((item) => /^https?:\/\//i.test(item))
  return Array.from(new Set(urls)).slice(0, 12)
}

export function resolveEventAdmissionMode(ticketing: boolean, tickets: EventTicketDraft[]): EventAdmissionMode {
  if (!ticketing) return 'open'
  return tickets.some((ticket) => integer(ticket.priceXpf) > 0) ? 'paid' : 'free'
}

export async function uploadEventPhotos(files: File[], onProgress?: (percentage: number) => void) {
  const response = await uploadApi.uploadEventImages(files, {
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
    },
  })
  const rows = Array.isArray(response.data?.data) ? response.data.data : []
  return normalizeEventPhotoUrls(rows.map((item: { url?: string }) => item.url))
}

function buildEventPayload(form: EventPublishDraft, admissionMode: EventAdmissionMode, tickets: EventTicketDraft[]) {
  const ticketing = admissionMode !== 'open'
  const photos = normalizeEventPhotoUrls(form.photoUrls, form.coverImageUrl)
  const prices = ticketing
    ? tickets.map((ticket) => admissionMode === 'free' ? 0 : integer(ticket.priceXpf))
    : [0]
  const isFree = admissionMode !== 'paid'
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    venue_name: form.venueName.trim(),
    venue_address: form.venueAddress.trim() || null,
    commune_id: Number(form.communeId),
    event_date: form.eventDate,
    event_time: form.startTime,
    end_time: form.endTime || null,
    cover_image_url: photos[0] || null,
    photos,
    category: form.category,
    status: 'published',
    has_ticketing: ticketing,
    max_capacity: ticketing ? tickets.reduce((sum, ticket) => sum + integer(ticket.quantity), 0) : null,
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
          price_xpf: admissionMode === 'free' ? 0 : integer(ticket.priceXpf),
          quantity_total: integer(ticket.quantity),
          is_active: true,
          position: index,
        }))
      : [],
  }
}

function normalizeManagedEvent(value: unknown): ManagedEventDraft {
  const row = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const ticketRows = Array.isArray(row.ticket_types) ? row.ticket_types : []
  const normalizedTickets = ticketRows.map((value) => {
    const ticket = value && typeof value === 'object' ? value as Record<string, unknown> : {}
    return {
      name: String(ticket.name ?? ''),
      description: String(ticket.description ?? ''),
      priceXpf: String(ticket.price_xpf ?? 0),
      quantity: String(ticket.quantity_total ?? 1),
    }
  })
  const ticketing = Boolean(row.has_ticketing)
  const coverImageUrl = String(row.cover_image_url ?? '')
  return {
    id: String(row.id ?? ''),
    status: row.status === 'draft' ? 'draft' : 'published',
    form: {
      title: String(row.title ?? ''),
      description: String(row.description ?? ''),
      category: EVENT_CATEGORIES.some((option) => option.value === row.category) ? row.category as EventPublishDraft['category'] : 'autre',
      eventDate: String(row.event_date ?? '').slice(0, 10),
      startTime: String(row.event_time ?? '').slice(0, 5),
      endTime: String(row.end_time ?? '').slice(0, 5),
      venueName: String(row.venue_name ?? ''),
      communeId: row.commune_id == null ? '' : String(row.commune_id),
      venueAddress: String(row.venue_address ?? ''),
      coverImageUrl,
      photoUrls: normalizeEventPhotoUrls(row.photos, coverImageUrl),
      organizerName: String(row.organizer_name ?? ''),
      organizerEmail: String(row.organizer_email ?? ''),
      organizerPhone: String(row.organizer_phone ?? ''),
      websiteUrl: String(row.website_url ?? ''),
    },
    ticketing,
    admissionMode: resolveEventAdmissionMode(ticketing, normalizedTickets),
    tickets: normalizedTickets,
    ticketingLocked: Boolean(row.ticketing_locked),
  }
}

export async function getManagedEvent(id: string): Promise<ManagedEventDraft> {
  return demoOr(
    async () => (await import('@/demo/fixtures/events')).managedEventDraftFixture,
    async () => {
      const response = await eventsApi.getMineById(id)
      const managed = normalizeManagedEvent(response.data?.data)
      if (!managed.id) throw new Error('Événement introuvable.')
      return managed
    },
  )
}

export async function updateManagedEvent(
  id: string,
  form: EventPublishDraft,
  admissionMode: EventAdmissionMode,
  tickets: EventTicketDraft[],
): Promise<EventPublishResult> {
  return demoOr(
    async () => ({ id, href: '/profil/evenements' }),
    async () => {
      await eventsApi.updateMine(id, buildEventPayload(form, admissionMode, tickets))
      return { id, href: '/profil/evenements' }
    },
  )
}

export async function publishEvent(
  form: EventPublishDraft,
  admissionMode: EventAdmissionMode,
  tickets: EventTicketDraft[],
): Promise<EventPublishResult> {
  return demoOr(
    async () => (await import('@/demo/fixtures/events')).eventPublishResultFixture,
    async () => {
      const response = await eventsApi.create(buildEventPayload(form, admissionMode, tickets))
      const id = String(response.data?.data?.id ?? '')
      if (!id) throw new Error('Le serveur n’a pas retourné l’identifiant de l’événement.')
      return { id, href: `/evenements/${id}` }
    },
  )
}
