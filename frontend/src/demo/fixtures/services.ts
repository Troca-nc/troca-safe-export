import type { QuoteRequest, ServicesCatalog, ShippingEstimate, ShippingRequest } from '@/types/services'

export const demoServicesCatalog: ServicesCatalog = {
  categories: [
    { slug: 'menuiserie-demo', name: 'Menuiserie (démo)' },
    { slug: 'entretien-demo', name: 'Entretien extérieur (démo)' },
    { slug: 'informatique-demo', name: 'Assistance informatique (démo)' },
  ],
  communes: [
    { id: 1, name: 'Nouméa', slug: 'noumea', provinceName: 'Province Sud' },
    { id: 2, name: 'Païta', slug: 'paita', provinceName: 'Province Sud' },
    { id: 3, name: 'Bourail', slug: 'bourail', provinceName: 'Province Sud' },
    { id: 4, name: 'Koné', slug: 'kone', provinceName: 'Province Nord' },
  ],
  pros: [
    { id: 501, name: 'Atelier du Pic (démo)', category: 'Menuiserie (démo)', commune: 'Païta', description: 'Fabrication et réparations sur mesure pour la maison.', logoUrl: null, rating: 4.8, reviewCount: 24, listingCount: 4, verified: true },
    { id: 502, name: 'Jardins du Col (démo)', category: 'Entretien extérieur (démo)', commune: 'Bourail', description: 'Entretien ponctuel ou régulier des jardins particuliers.', logoUrl: null, rating: 4.6, reviewCount: 17, listingCount: 3, verified: true },
    { id: 503, name: 'Déclic Micro (démo)', category: 'Assistance informatique (démo)', commune: 'Nouméa', description: 'Dépannage et accompagnement numérique à domicile.', logoUrl: null, rating: 4.9, reviewCount: 31, listingCount: 2, verified: true },
  ],
}

export const demoQuoteRequests: QuoteRequest[] = [
  {
    id: 601,
    categorySlug: 'menuiserie-demo',
    categoryName: 'Menuiserie (démo)',
    commune: 'Païta',
    title: 'Réparer deux volets (démo)',
    description: 'Deux volets en bois ferment difficilement après les dernières pluies.',
    budgetMinXpf: null,
    budgetMaxXpf: 85000,
    desiredDate: '2027-02-10',
    status: 'open',
    createdAt: '2027-01-18T08:00:00.000Z',
    offerCount: 2,
    offers: [
      { id: 701, proName: 'Atelier du Pic (démo)', proRating: 4.8, amountXpf: 62000, delayDays: 5, message: 'Déplacement et fournitures courantes inclus.', status: 'pending' },
      { id: 702, proName: 'Bois des Plaines (démo)', proRating: 4.5, amountXpf: 71000, delayDays: 3, message: null, status: 'pending' },
    ],
  },
]

export const demoShippingEstimate: ShippingEstimate = {
  estimatedMinXpf: 7800,
  estimatedMaxXpf: 11600,
  distanceKm: 162,
  volumeLabel: 'Petit colis',
  weightLabel: 'Moins de 10 kg',
  summary: 'Nouméa vers Bourail, petit colis (démo)',
}

export const demoShippingRequests: ShippingRequest[] = [
  {
    id: 801,
    departure: 'Nouméa',
    destination: 'Bourail',
    cargoType: 'Carton de livres (démo)',
    status: 'offers_received',
    statusLabel: 'Offres reçues',
    offersCount: 1,
    selectedOfferId: null,
    estimatedMinXpf: 7800,
    estimatedMaxXpf: 11600,
    offers: [
      { id: 901, amountXpf: 9800, pickupDate: '2027-02-02', pickupSlot: 'Matin', status: 'pending', transporterName: 'Messagerie Broussarde (démo)', transporterRating: 4.7, transporterVerified: true },
    ],
  },
]
