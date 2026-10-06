import type { CommuneOption, FreightRequest } from '@/types/freight'

export const demoCommunes: CommuneOption[] = [
  { id: 1, name: 'Nouméa', slug: 'noumea', provinceName: 'Province Sud' },
  { id: 2, name: 'Dumbéa', slug: 'dumbea', provinceName: 'Province Sud' },
  { id: 3, name: 'Bourail', slug: 'bourail', provinceName: 'Province Sud' },
  { id: 4, name: 'Koné', slug: 'kone', provinceName: 'Province Nord' },
]
export const demoFreightRequests: FreightRequest[] = [
  { id: 101, departure: 'Nouméa', destination: 'Bourail', cargoType: 'Mobilier de maison (démo)', volumeBucket: 'range_5_15', weightBucket: 'range_50_200', status: 'offers_received', statusLabel: 'Offres reçues', offersCount: 2, selectedOfferId: null, estimatedMinXpf: 18000, estimatedMaxXpf: 26000, offers: [
    { id: 201, amountXpf: 22000, pickupDate: '2027-01-15', pickupSlot: 'Matin', message: 'Chargement et sangles inclus.', status: 'pending', transporterName: 'Transport lagon (démo)', transporterRating: 4.8, transporterVerified: true },
    { id: 202, amountXpf: 24500, pickupDate: '2027-01-16', pickupSlot: 'Après-midi', message: null, status: 'pending', transporterName: 'Fret côte Ouest (démo)', transporterRating: 4.6, transporterVerified: true },
  ] },
]
