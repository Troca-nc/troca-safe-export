import type { EventPublishMetadata, EventPublishResult, ManagedEventDraft } from '@/types/events'

export const eventPublishMetadataFixture: EventPublishMetadata = {
  communes: [
    { id: 1, name: 'Nouméa' },
    { id: 2, name: 'Dumbéa' },
    { id: 3, name: 'Mont-Dore' },
    { id: 4, name: 'Païta' },
    { id: 5, name: 'Bourail' },
    { id: 6, name: 'Koné' },
  ],
}

export const eventPublishResultFixture: EventPublishResult = {
  id: 'demo-event',
  href: '/evenements',
}

export const managedEventDraftFixture: ManagedEventDraft = {
  id: 'demo-event',
  status: 'published',
  form: {
    title: 'Marché des créateurs du Pacifique',
    description: 'Une journée pour découvrir les créateurs locaux.',
    category: 'marche',
    eventDate: '2026-12-12',
    startTime: '09:00',
    endTime: '17:00',
    venueName: 'Place des Cocotiers',
    communeId: '1',
    venueAddress: 'Centre-ville',
    coverImageUrl: '',
    photoUrls: [],
    organizerName: 'Collectif Kalico',
    organizerEmail: 'demo@kalico.nc',
    organizerPhone: '+687 00 00 00',
    websiteUrl: 'https://kalico.nc',
    bookingUrl: '',
  },
  ticketing: false,
  admissionMode: 'open',
  paidReservationMode: 'onsite',
  tickets: [],
  ticketingLocked: false,
}
