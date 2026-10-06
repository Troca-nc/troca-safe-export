import type { SearchAlert } from '@/types/alert.types'
import type { PersonalAccountFixture } from '@/types/personal-account'

const now = Date.now()
const days = (value: number) => new Date(now + value * 86_400_000).toISOString()

const alerts: SearchAlert[] = [
  {
    id: 801,
    user_id: 0,
    label: 'Kayak ou paddle (démo)',
    filters: { q: 'kayak paddle', categorie: 'Nautisme', commune: 'Grand Nouméa', prix_max: 60000 },
    frequency: 'immediate',
    status: 'active',
    nb_results: 12,
    last_sent_at: days(-1),
    created_at: days(-18),
    unsubscribe_token: 'demo-alert-801',
  },
  {
    id: 802,
    user_id: 0,
    label: 'Réfrigérateur américain (démo)',
    filters: { q: 'réfrigérateur américain', commune: 'Nouméa' },
    frequency: 'daily',
    status: 'paused',
    nb_results: 5,
    last_sent_at: days(-4),
    created_at: days(-30),
    unsubscribe_token: 'demo-alert-802',
  },
]

export const personalAccountFixture: PersonalAccountFixture = {
  listings: {
    capacity: { used: 3, limit: 5 },
    listings: [
      { id: 'demo-listing-frigo', title: 'Réfrigérateur américain Samsung (démo)', price: 85000, status: 'active', categoryName: 'Maison', communeName: 'Nouméa', coverImage: null, views: 206, favorites: 14, messages: 11, publishedAt: days(-12), expiresAt: days(48), isTroc: false },
      { id: 'demo-listing-surf', title: 'Planche de surf avec housse (démo)', price: 45000, status: 'active', categoryName: 'Nautisme', communeName: 'Dumbéa', coverImage: null, views: 148, favorites: 9, messages: 6, publishedAt: days(-5), expiresAt: days(55), isTroc: true },
      { id: 'demo-listing-kayak', title: 'Kayak deux places (démo)', price: 38000, status: 'active', categoryName: 'Nautisme', communeName: 'Mont-Dore', coverImage: null, views: 31, favorites: 1, messages: 0, publishedAt: days(-54), expiresAt: days(6), isTroc: true },
      { id: 'demo-listing-console', title: 'Console et deux manettes (démo)', price: 22000, status: 'pending', categoryName: 'Loisirs', communeName: 'Nouméa', coverImage: null, views: 0, favorites: 0, messages: 0, publishedAt: null, expiresAt: null, isTroc: false },
      { id: 'demo-listing-table', title: 'Table de jardin en teck (démo)', price: 30000, status: 'sold', categoryName: 'Maison', communeName: 'Païta', coverImage: null, views: 312, favorites: 18, messages: 9, publishedAt: days(-80), expiresAt: days(-20), isTroc: false },
      { id: 'demo-listing-tente', title: 'Tente quatre places (démo)', price: 12000, status: 'expired', categoryName: 'Loisirs', communeName: 'Nouméa', coverImage: null, views: 87, favorites: 2, messages: 1, publishedAt: days(-62), expiresAt: days(-2), isTroc: false },
    ],
  },
  favorites: [
    { id: 'demo-favorite-paddle', title: 'Paddle gonflable (démo)', price: 35000, status: 'active', categoryName: 'Nautisme', communeName: 'Mont-Dore', coverImage: null, savedAt: days(-2), priceDropXpf: 5000 },
    { id: 'demo-favorite-hilux', title: 'Toyota Hilux 2019 (démo)', price: 4250000, status: 'active', categoryName: 'Véhicules', communeName: 'Nouméa', coverImage: null, savedAt: days(-5), priceDropXpf: null },
    { id: 'demo-favorite-canape', title: 'Canapé en teck (démo)', price: 30000, status: 'active', categoryName: 'Maison', communeName: 'Koné', coverImage: null, savedAt: days(-8), priceDropXpf: null },
    { id: 'demo-favorite-velo', title: 'Vélo de route carbone (démo)', price: 150000, status: 'sold', categoryName: 'Véhicules', communeName: 'Païta', coverImage: null, savedAt: days(-12), priceDropXpf: null },
  ],
  alerts,
  alertResults: {
    '801': [
      { id: 'demo-match-paddle', title: 'Paddle rigide avec pagaie (démo)', price: 48000, communeName: 'Dumbéa', coverImage: null, publishedAt: days(-1) },
      { id: 'demo-match-kayak', title: 'Kayak de mer Rotomod (démo)', price: 55000, communeName: 'Nouméa', coverImage: null, publishedAt: days(-2) },
    ],
    '802': [
      { id: 'demo-match-frigo', title: 'Réfrigérateur LG 600 L (démo)', price: 95000, communeName: 'Nouméa', coverImage: null, publishedAt: days(-4) },
    ],
  },
  offers: [
    { kind: 'price', id: 'demo-offer-price', status: 'pending', listingId: 'demo-listing-frigo', listingTitle: 'Réfrigérateur américain Samsung (démo)', listingImage: null, personName: 'Jean T. (démo)', personAvatarUrl: null, rating: 4.8, offeredXpf: 75000, askingXpf: 85000, createdAt: days(-1), expiresAt: days(1) },
    { kind: 'troc', id: 'demo-offer-troc', status: 'pending', listingId: 'demo-listing-kayak', listingTitle: 'Kayak deux places (démo)', personName: 'Tehani R. (démo)', offeredDescription: 'Planche mini-malibu avec housse', offeredListingTitle: 'Planche mini-malibu (démo)', offeredValueXpf: 45000, requestedValueXpf: 38000, complementXpf: 0, complementDirection: 'none', message: 'Disponible ce week-end.', createdAt: days(-1), expiresAt: days(6) },
  ],
}
