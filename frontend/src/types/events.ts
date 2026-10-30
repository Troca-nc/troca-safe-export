export type EventCategoryValue =
  | 'concert'
  | 'festival'
  | 'sport'
  | 'marche'
  | 'conference'
  | 'exposition'
  | 'cinema'
  | 'spectacle'
  | 'autre'

export type EventCategoryOption = {
  value: EventCategoryValue
  label: string
}

export type EventCommuneOption = {
  id: number
  name: string
}

export type EventTicketDraft = {
  name: string
  description: string
  priceXpf: string
  quantity: string
}

export type EventPublishDraft = {
  title: string
  description: string
  category: EventCategoryValue | ''
  eventDate: string
  startTime: string
  endTime: string
  venueName: string
  communeId: string
  venueAddress: string
  coverImageUrl: string
  organizerName: string
  organizerEmail: string
  organizerPhone: string
  websiteUrl: string
}

export type StoredEventDraft = {
  form: EventPublishDraft
  ticketing: boolean
  tickets: EventTicketDraft[]
  savedAt: string
}

export type EventPublishMetadata = {
  communes: EventCommuneOption[]
}

export type EventPublishResult = {
  id: string
  href: string
}
