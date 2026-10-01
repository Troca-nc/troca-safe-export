import { FALLBACK_CATEGORIES } from '@/lib/categoryCatalog'
import type { ListingProvince, ListingSearchItem, ListingsMetadata } from '@/types/listings'

const baseDate = '2026-09-30'

export const demoListings: ListingSearchItem[] = [
  ['velo', 'Vélo urbain révisé — démonstration', 42000, 'good', 'vehicules', 'Véhicules', 'demo-commune-noumea', 'Nouméa', 'demo-province-sud', 'Ariane (démo)'],
  ['fauteuil', 'Fauteuil en rotin — démonstration', 28000, 'like_new', 'maison-jardin', 'Maison & Jardin', 'demo-commune-dumbea', 'Dumbéa', 'demo-province-sud', 'Noa (démo)'],
  ['ordinateur', 'Ordinateur portable — démonstration', 79000, 'good', 'electronique-multimedia', 'Électronique & Multimédia', 'demo-commune-paita', 'Païta', 'demo-province-sud', 'Lina (démo)'],
  ['planche', 'Planche de surf — démonstration', 36000, 'good', 'loisirs', 'Loisirs', 'demo-commune-mont-dore', 'Mont-Dore', 'demo-province-sud', 'Téva (démo)'],
  ['outillage', 'Lot d’outillage — démonstration', 54000, 'fair', 'bricolage-outillage', 'Bricolage & Outillage', 'demo-commune-bourail', 'Bourail', 'demo-province-sud', 'Malia (démo)'],
  ['livres', 'Collection de livres — démonstration', 12000, 'good', 'collections-antiquites', 'Collections & Antiquités', 'demo-commune-kone', 'Koné', 'demo-province-nord', 'Eli (démo)'],
  ['plante', 'Plante en pot — démonstration', 4500, 'like_new', 'maison-jardin', 'Maison & Jardin', 'demo-commune-lifou', 'Lifou', 'demo-province-iles', 'Néa (démo)'],
  ['don-cartons', 'Cartons de déménagement — démonstration', null, 'good', 'don', 'Dons', 'demo-commune-poindimie', 'Poindimié', 'demo-province-nord', 'Sacha (démo)'],
  ['service-jardin', 'Entretien de jardin — démonstration', 8500, 'new', 'services', 'Services', 'demo-commune-dumbea', 'Dumbéa', 'demo-province-sud', 'Jardins du Lagon (démo)'],
  ['studio', 'Studio meublé — démonstration', 118000, 'good', 'immobilier', 'Immobilier', 'demo-commune-noumea', 'Nouméa', 'demo-province-sud', 'Habitat Sud (démo)'],
  ['bungalow', 'Bungalow pour un week-end — démonstration', 18000, 'good', 'location_courte_duree', 'Locations', 'demo-commune-lifou', 'Lifou', 'demo-province-iles', 'Accueil des Îles (démo)'],
  ['troc-paddle', 'Paddle contre vélo — démonstration', 24000, 'good', 'loisirs', 'Loisirs', 'demo-commune-mont-dore', 'Mont-Dore', 'demo-province-sud', 'Maeva (démo)'],
].map((value, index) => {
  const [key, title, price, condition, categorySlug, categoryName, communeId, communeName, provinceId, seller] = value
  const troc = key === 'troc-paddle'
  return {
    id: `demo-listing-${key}`,
    title: String(title),
    price: price === null ? null : Number(price),
    price_negotiable: index % 3 === 0,
    is_free: price === null,
    condition: String(condition),
    is_featured: index === 0,
    is_urgent: false,
    is_troc: troc,
    contre_quoi: troc ? 'Un vélo en bon état' : null,
    published_at: `${baseDate}T${String(12 - index).padStart(2, '0')}:00:00.000Z`,
    commune_id: String(communeId),
    province_id: String(provinceId),
    commune_name: String(communeName),
    category_name: String(categoryName),
    category_slug: String(categorySlug),
    seller_prenom: String(seller),
    seller_nom: null,
    seller_note_moyenne: index % 4 === 3 ? null : 4.5 + (index % 5) / 10,
    seller_nb_avis: index % 4 === 3 ? null : 4 + index * 2,
    seller_email_verified: true,
    seller_phone_verified: index % 2 === 0,
    is_pro: index === 8 || index === 9 || index === 10,
    seller_pro_verified: index === 8 || index === 9 || index === 10,
  } satisfies ListingSearchItem
})

export const demoListingProvinces: ListingProvince[] = [
  {
    id: 'demo-province-sud',
    name: 'Province Sud',
    code: 'S',
    communes: [
      { id: 'demo-commune-noumea', name: 'Nouméa', slug: 'noumea' },
      { id: 'demo-commune-dumbea', name: 'Dumbéa', slug: 'dumbea' },
      { id: 'demo-commune-paita', name: 'Païta', slug: 'paita' },
      { id: 'demo-commune-mont-dore', name: 'Mont-Dore', slug: 'mont-dore' },
      { id: 'demo-commune-bourail', name: 'Bourail', slug: 'bourail' },
    ],
  },
  {
    id: 'demo-province-nord',
    name: 'Province Nord',
    code: 'N',
    communes: [
      { id: 'demo-commune-kone', name: 'Koné', slug: 'kone' },
      { id: 'demo-commune-poindimie', name: 'Poindimié', slug: 'poindimie' },
    ],
  },
  {
    id: 'demo-province-iles',
    name: 'Province des Îles',
    code: 'I',
    communes: [{ id: 'demo-commune-lifou', name: 'Lifou', slug: 'lifou' }],
  },
]

export const demoListingsMetadata: ListingsMetadata = {
  categories: FALLBACK_CATEGORIES,
  provinces: demoListingProvinces,
}

export const demoZonesByCommune: Record<string, string[]> = {
  noumea: ['Centre-ville', 'Ducos', 'Magenta'],
  dumbea: ['Dumbéa-sur-Mer', 'Koutio'],
  'mont-dore': ['Boulari', 'La Coulée'],
}
