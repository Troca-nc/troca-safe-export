import type { RegistrationCommune, RegistrationOffer } from '@/types/registration'

const communeNames = [
  'Bélep',
  'Boulouparis',
  'Bourail',
  'Canala',
  'Dumbéa',
  'Farino',
  'Hienghène',
  'Houaïlou',
  'Île des Pins',
  'Kaala-Gomen',
  'Koné',
  'Kouaoua',
  'Koumac',
  'La Foa',
  'Lifou',
  'Maré',
  'Moindou',
  'Mont-Dore',
  'Nouméa',
  'Ouégoa',
  'Ouvéa',
  'Païta',
  'Poindimié',
  'Ponérihouen',
  'Pouébo',
  'Pouembout',
  'Poum',
  'Poya',
  'Sarraméa',
  'Thio',
  'Touho',
  'Voh',
  'Yaté',
]

export const registrationCommunes: RegistrationCommune[] = communeNames.map((name, index) => ({
  id: index + 1,
  name,
}))

export const registrationOffers: RegistrationOffer[] = [
  {
    id: 'free',
    name: 'Gratuit',
    priceXpf: 0,
    cadence: 'sans limite de durée',
    features: ['5 annonces actives', '6 photos par annonce', 'Messagerie intégrée'],
  },
  {
    id: 'pro-monthly',
    name: 'Kalico Pro mensuel',
    priceXpf: 2900,
    cadence: 'par mois',
    features: ['Annonces illimitées', '12 photos par annonce', 'Statistiques et badge Pro'],
    recommended: true,
  },
  {
    id: 'pro-yearly',
    name: 'Kalico Pro annuel',
    priceXpf: 44900,
    cadence: 'par an',
    features: ['Tous les avantages Pro', 'Facturation annuelle', 'Support prioritaire'],
  },
]
