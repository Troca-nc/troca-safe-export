import type { ProPublicProfile, ProPublicReview, ProSummary } from '@/types/pro-public'

export const demoPros: ProSummary[] = [
  { id: 1401, name: 'Atelier des Alizés (démo)', firstName: 'Maëlle', lastName: 'K.', companyName: 'Atelier des Alizés (démo)', category: 'Menuiserie (démo)', commune: 'Païta', description: 'Agencements et réparations en bois réalisés sur mesure.', logoUrl: null, bannerUrl: null, rating: 4.8, reviewCount: 19, listingCount: 4, latestReview: 'Une intervention soignée et des explications claires.', verified: true },
  { id: 1402, name: 'Lagon Numérique (démo)', firstName: 'Noé', lastName: 'W.', companyName: 'Lagon Numérique (démo)', category: 'Assistance informatique (démo)', commune: 'Dumbéa', description: 'Dépannage, installation et accompagnement numérique à domicile.', logoUrl: null, bannerUrl: null, rating: 4.6, reviewCount: 11, listingCount: 2, latestReview: null, verified: true },
  { id: 1403, name: 'Jardins du Creek (démo)', firstName: 'Anaïs', lastName: 'T.', companyName: 'Jardins du Creek (démo)', category: 'Entretien extérieur (démo)', commune: 'Bourail', description: 'Entretien ponctuel ou régulier des jardins particuliers.', logoUrl: null, bannerUrl: null, rating: 0, reviewCount: 0, listingCount: 1, latestReview: null, verified: true },
]

export const demoProReviews: ProPublicReview[] = [
  { id: 1501, rating: 5, title: 'Travail très soigné (démo)', comment: 'Le besoin a été bien compris et le chantier est resté propre.', created_at: '2027-01-08T08:00:00.000Z', reviewer_prenom: 'Élise', reviewer_nom: 'M.', verified_purchase: true },
  { id: 1502, rating: 4, title: 'Bon accompagnement (démo)', comment: 'Des conseils utiles et un résultat conforme à notre demande.', created_at: '2026-12-19T08:00:00.000Z', reviewer_prenom: 'Téo', reviewer_nom: 'R.', verified_purchase: true },
]

export const demoProProfile: ProPublicProfile = {
  id: 1401,
  display_name: 'Atelier des Alizés (démo)',
  pro_company_name: 'Atelier des Alizés (démo)',
  pro_category: 'Menuiserie (démo)',
  pro_description: 'Agencements, réparations et mobilier en bois réalisés sur mesure pour les particuliers.',
  pro_commune: 'Païta',
  pro_phone: '00 00 00',
  pro_hours: 'Du lundi au vendredi, sur rendez-vous',
  pro_verified: true,
  avg_rating: 4.5,
  review_count: 2,
  listing_count: 2,
  product_count: 3,
  pro_portfolio_photos: [],
  reviews: demoProReviews,
  catalog_categories: [{ id: 1601, name: 'Aménagement (démo)' }, { id: 1602, name: 'Réparation (démo)' }],
  products: [
    { id: 1701, title: 'Étagère murale sur mesure (démo)', description: 'Conception adaptée aux dimensions et à la finition souhaitées.', price_type: 'from', price_xpf: 28000, stock_quantity: null, catalog_category_id: 1601, catalog_category_name: 'Aménagement (démo)', commune_name: 'Païta' },
    { id: 1702, title: 'Réparation de volet bois (démo)', description: 'Diagnostic, ajustement et remplacement des pièces abîmées.', price_type: 'on_quote', price_xpf: 0, stock_quantity: null, catalog_category_id: 1602, catalog_category_name: 'Réparation (démo)', commune_name: 'Païta' },
    { id: 1703, title: 'Table basse en bois local (démo)', description: 'Modèle personnalisable selon les dimensions de votre salon.', price_type: 'fixed', price_xpf: 54000, stock_quantity: 2, catalog_category_id: 1601, catalog_category_name: 'Aménagement (démo)', commune_name: 'Païta' },
  ],
  listings: [
    { id: 1801, title: 'Chutes de bois sec disponibles (démo)', description: 'Lots adaptés aux petits projets créatifs.' },
    { id: 1802, title: 'Créneaux pour réparations en février (démo)', description: 'Interventions à Païta et dans les communes voisines.' },
  ],
  booking_settings: {
    is_enabled: true,
    title: 'Choisir un rendez-vous (démo)',
    subtitle: 'Présentez votre projet pendant un premier échange.',
    location_label: 'Atelier',
    location_text: 'Païta',
    slot_duration_minutes: 30,
    advance_notice_hours: 24,
    max_days_ahead: 30,
    services: [{ title: 'Étude du projet (démo)', duration_minutes: 30, price_xpf: null, is_active: true }],
  },
  booking_slots: [],
}
