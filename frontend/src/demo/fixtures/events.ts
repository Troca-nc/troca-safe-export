import type { EventPublishMetadata, EventPublishResult } from '@/types/events'

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
