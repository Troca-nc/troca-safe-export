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

export type EventAdmissionMode = 'open' | 'free' | 'paid'

export type EventPaidReservationMode = 'onsite' | 'external'

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
  photoUrls: string[]
  organizerName: string
  organizerEmail: string
  organizerPhone: string
  websiteUrl: string
  bookingUrl: string
}

export type StoredEventDraft = {
  form: EventPublishDraft
  ticketing: boolean
  admissionMode?: EventAdmissionMode
  paidReservationMode?: EventPaidReservationMode
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

export type ManagedEventDraft = {
  id: string
  status: 'draft' | 'published'
  form: EventPublishDraft
  ticketing: boolean
  admissionMode: EventAdmissionMode
  paidReservationMode: EventPaidReservationMode
  tickets: EventTicketDraft[]
  ticketingLocked: boolean
}
