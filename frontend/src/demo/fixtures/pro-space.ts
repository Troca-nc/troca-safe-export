import type { ProSpaceData } from '@/types/pro-space'

export const demoProSpaceData: ProSpaceData = {
  dashboard: {
    listings: { total: 9, active: 7, boosted: 2, expired: 2 },
    stats: {
      views_total: 1480,
      views_7d: 186,
      views_30d: 704,
      contacts_total: 94,
      contacts_7d: 13,
      avg_conversion_rate: 6.4,
    },
    timeline_30d: [
      { day: '2026-10-01', label: '1 oct.', views: 18, contacts: 2 },
      { day: '2026-10-02', label: '2 oct.', views: 25, contacts: 3 },
      { day: '2026-10-03', label: '3 oct.', views: 21, contacts: 1 },
      { day: '2026-10-04', label: '4 oct.', views: 32, contacts: 4 },
      { day: '2026-10-05', label: '5 oct.', views: 29, contacts: 2 },
      { day: '2026-10-06', label: '6 oct.', views: 36, contacts: 5 },
      { day: '2026-10-07', label: '7 oct.', views: 25, contacts: 3 },
    ],
  },
  products: [
    { id: 101, title: 'Forfait entretien terrasse (démo)', description: 'Nettoyage et finition.', price_type: 'fixed', price_xpf: 18500, stock_quantity: null, is_available: true, is_active: true, is_featured: true, unit_label: 'forfait', cover_image_url: null, catalog_category_name: 'Entretien', published_listing_count: 3 },
    { id: 102, title: 'Banc en bois local (démo)', description: 'Fabrication artisanale.', price_type: 'from', price_xpf: 42000, stock_quantity: 3, is_available: true, is_active: true, is_featured: false, unit_label: 'pièce', cover_image_url: null, catalog_category_name: 'Mobilier', published_listing_count: 1 },
    { id: 103, title: 'Huile de protection 1 L (démo)', description: 'Produit de finition.', price_type: 'fixed', price_xpf: 3900, stock_quantity: 0, is_available: false, is_active: true, is_featured: false, unit_label: 'bidon', cover_image_url: null, catalog_category_name: 'Finitions', published_listing_count: 2 },
  ],
  requests: [
    { id: '501', requesterUserId: 201, createdAt: '2026-10-07T01:20:00.000Z', isLockedForFree: false, request: { requester_name: 'Lina (démo)', requester_email: 'lina.demo@example.test', requester_phone: '00 00 00', need_type: 'Terrasse', commune: 'Dumbéa', budget_xpf: '150000', desired_date: '2026-10-20', details: 'Rénovation d’une petite terrasse de démonstration.' } },
  ],
  quotes: [
    { id: 601, quote_number: 'DEVIS-DEMO-0001', requester_name: 'Lina (démo)', requester_email: 'lina.demo@example.test', requester_phone: null, commune: 'Dumbéa', subject: 'Rénovation terrasse (démo)', items: [], subtotal_xpf: 120000, tgc_amount_xpf: 7200, total_xpf: 127200, deposit_percent: 30, deposit_amount_xpf: 38160, balance_due_xpf: 89040, validity_days: 30, status: 'sent', valid_until: '2026-11-01T00:00:00.000Z', sent_at: '2026-10-02T00:00:00.000Z', last_reminded_at: null, reminder_count: 0, paid_at: null, created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-02T00:00:00.000Z' },
    { id: 602, quote_number: 'DEVIS-DEMO-0002', requester_name: 'Noa (démo)', requester_email: 'noa.demo@example.test', requester_phone: null, commune: 'Nouméa', subject: 'Banc sur mesure (démo)', items: [], subtotal_xpf: 52000, tgc_amount_xpf: 5720, total_xpf: 57720, deposit_percent: 25, deposit_amount_xpf: 14430, balance_due_xpf: 43290, validity_days: 20, status: 'accepted', valid_until: '2026-10-25T00:00:00.000Z', sent_at: '2026-10-03T00:00:00.000Z', last_reminded_at: null, reminder_count: 0, paid_at: null, created_at: '2026-10-02T00:00:00.000Z', updated_at: '2026-10-05T00:00:00.000Z' },
    { id: 603, quote_number: 'DEVIS-DEMO-0003', requester_name: 'Malia (démo)', requester_email: 'malia.demo@example.test', requester_phone: null, commune: 'Païta', subject: 'Entretien annuel (démo)', items: [], subtotal_xpf: 36000, tgc_amount_xpf: 1080, total_xpf: 37080, deposit_percent: 0, deposit_amount_xpf: 0, balance_due_xpf: 37080, validity_days: 30, status: 'paid', valid_until: '2026-10-28T00:00:00.000Z', sent_at: '2026-09-28T00:00:00.000Z', last_reminded_at: null, reminder_count: 1, paid_at: '2026-10-06T00:00:00.000Z', created_at: '2026-09-27T00:00:00.000Z', updated_at: '2026-10-06T00:00:00.000Z' },
  ],
  bookings: [
    { id: 701, requester_name: 'Noa (démo)', subject: 'Prise de mesures (démo)', starts_at: '2026-10-08T22:00:00.000Z', ends_at: '2026-10-08T23:00:00.000Z', status: 'confirmed', commune: 'Nouméa' },
    { id: 702, requester_name: 'Lina (démo)', subject: 'Visite terrasse (démo)', starts_at: '2026-10-10T00:30:00.000Z', ends_at: '2026-10-10T01:30:00.000Z', status: 'pending', commune: 'Dumbéa' },
  ],
  reviewSummary: { avg_rating: 4.8, review_count: 12, verified_count: 9 },
  reviews: [
    { id: 801, reviewer_prenom: 'Malia (démo)', rating: 5, title: 'Travail soigné (démo)', comment: 'Un avis de démonstration clairement identifié.', verified_purchase: true, reply_content: null, created_at: '2026-10-04T00:00:00.000Z' },
  ],
  reviewsUnavailable: false,
  profile: { id: 901, pro_company_name: 'Atelier du Lagon (démo)', pro_description: 'Atelier local de démonstration.', pro_logo_url: null, pro_commune: 'Nouméa', pro_phone: '00 00 00', pro_hours: 'Sur rendez-vous' },
  profileUnavailable: false,
  templates: [
    { id: 901, pro_id: 901, name: 'Intervention standard (démo)', subject: 'Proposition d’intervention (démo)', client_note: 'Merci pour votre demande de démonstration.', items: [{ id: 'line-1', label: 'Main-d’œuvre (démo)', description: null, unit: 'hour', quantity: 2, unit_price_xpf: 6500, tgc_rate: 6 }], validity_days: 30, deposit_percent: 25, created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z' },
  ],
  quoteConfig: { tgc_rates: [0, 3, 6, 11, 22], units: ['unit', 'hour', 'day', 'package', 'meter', 'square_meter', 'kilometer'] },
}
