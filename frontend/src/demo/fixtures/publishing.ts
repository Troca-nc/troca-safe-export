import type { PublishingDraft, PublishingKind, PublishingMetadata } from '@/types/publishing'

const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)

export const PUBLISHING_DEMO_METADATA: PublishingMetadata = {
  categories: [
    { id: 101, name: 'Nautisme', slug: 'nautisme' },
    { id: 102, name: 'Vélos', slug: 'velos' },
    { id: 103, name: 'Maison', slug: 'maison' },
    { id: 104, name: 'Multimédia', slug: 'multimedia' },
    { id: 105, name: 'Outillage', slug: 'outillage' },
  ],
  communes: [
    { id: 1, name: 'Nouméa', slug: 'noumea', provinceName: 'Province Sud' },
    { id: 2, name: 'Dumbéa', slug: 'dumbea', provinceName: 'Province Sud' },
    { id: 3, name: 'Mont-Dore', slug: 'mont-dore', provinceName: 'Province Sud' },
    { id: 4, name: 'Païta', slug: 'paita', provinceName: 'Province Sud' },
    { id: 5, name: 'Bourail', slug: 'bourail', provinceName: 'Province Sud' },
    { id: 6, name: 'Koné', slug: 'kone', provinceName: 'Province Nord' },
  ],
}

export const EMPTY_PUBLISHING_DRAFT: PublishingDraft = {
  kind: null,
  step: 0,
  title: '',
  description: '',
  categoryId: '',
  condition: 'good',
  priceXpf: '',
  negotiable: false,
  communeId: '',
  quartier: '',
  handoffModes: ['En main propre'],
  trocWants: [],
  trocWish: '',
  trocComplementXpf: '0',
  businessName: '',
  bonPlanCategory: 'sport',
  discountMode: 'percentage',
  discountPercent: '20',
  originalPriceXpf: '',
  promoPriceXpf: '',
  giftDescription: '',
  promoCode: '',
  validFrom: tomorrow,
  validUntil: nextWeek,
  conditions: '',
  channel: 'store',
  address: '',
  websiteUrl: '',
  durationDays: '7',
  contactEmail: '',
  contactName: '',
  contactPhone: '',
  departure: '',
  destination: '',
  departureCommuneId: '',
  destinationCommuneId: '',
  stops: '',
  frequency: 'once',
  rideDate: tomorrow,
  rideTime: '08:00',
  recurrenceDays: [],
  seats: '3',
  luggage: 'Valise',
  musicAllowed: true,
  noSmoking: true,
  animalsAllowed: false,
  womenOnly: false,
  vehicle: '',
  comfort: '',
  instantBooking: false,
  eventCategory: 'autre',
  organizerName: '',
  eventDate: tomorrow,
  eventTime: '18:00',
  eventEndTime: '',
  venueName: '',
  venueAddress: '',
  eventAccess: 'free',
  bookingUrl: '',
  capacity: '0',
}

export const PUBLISHING_DEMO_DRAFTS: Record<PublishingKind, Partial<PublishingDraft>> = {
  sale: {
    title: 'Planche de surf 6’4 avec housse',
    description: 'Planche locale en très bon état, housse et leash fournis.',
    categoryId: '101',
    priceXpf: '45000',
    communeId: '3',
    quartier: 'Boulari',
  },
  troc: {
    title: 'Planche de surf 7’2 mini-malibu',
    description: 'Planche stable avec quelques marques normales sur les rails.',
    categoryId: '101',
    priceXpf: '45000',
    communeId: '1',
    trocWants: ['Nautisme', 'Vélos'],
    trocWish: 'Un kayak ou un paddle familial.',
    trocComplementXpf: '10000',
  },
  bonplan: {
    title: '−30 % sur les planches de surf',
    description: 'Une sélection de planches locales à prix réduit pendant une semaine.',
    businessName: 'Surf Shop Anse Vata',
    originalPriceXpf: '65000',
    promoPriceXpf: '45500',
    discountPercent: '30',
    communeId: '1',
    address: '12 promenade Roger Laroque',
    contactEmail: 'bonplan@demo.kalico.nc',
  },
  carpool: {
    departure: 'Nouméa',
    destination: 'Koné',
    departureCommuneId: '1',
    destinationCommuneId: '6',
    stops: 'Païta, Bourail',
    priceXpf: '1600',
    vehicle: 'Toyota Hilux blanc',
    description: 'Départ ponctuel, pause possible à Bourail et bagages acceptés.',
  },
  event: {
    title: 'Marché nocturne de la Baie des Citrons',
    description: 'Artisans, producteurs, restauration et concert en soirée.',
    organizerName: 'Association Citrons en fête',
    eventCategory: 'marche',
    venueName: 'Promenade de la Baie des Citrons',
    venueAddress: 'Baie des Citrons',
    communeId: '1',
  },
}

export function createDemoPublishingResult(kind: PublishingKind) {
  const id = `demo-${kind}-${Date.now()}`
  const href = kind === 'sale' || kind === 'troc'
    ? `/annonces/${id}`
    : kind === 'bonplan'
      ? '/bons-plans'
      : kind === 'carpool'
        ? `/covoiturage/transport/${id}`
        : `/evenements/${id}`

  return { id, href }
}
