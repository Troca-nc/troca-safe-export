import type { BonsPlansPageData } from '@/types/bon-plans'

export const bonsPlansPageFixture: BonsPlansPageData = {
  promotions: [
    {
      id: 'demo-promo-panier', title: 'Panier de produits frais', description: 'Une sélection de saison proposée par un commerce de proximité.',
      businessName: 'Marché du quartier (démo)', businessSlug: 'marche-quartier-demo', businessInitials: 'MQ', businessLogoUrl: null,
      verified: true, category: 'Alimentation', commune: 'Nouméa', imageUrl: null, originalPriceXpf: 6800, promoPriceXpf: 4900,
      discountPercent: 28, publishedUntil: '2027-12-31T12:00:00+11:00', ctaLabel: 'Découvrir l’offre', ctaUrl: null,
    },
    {
      id: 'demo-promo-repas', title: 'Formule déjeuner locale', description: 'Plat du jour et boisson préparés sur place.',
      businessName: 'Table du lagon (démo)', businessSlug: 'table-lagon-demo', businessInitials: 'TL', businessLogoUrl: null,
      verified: true, category: 'Restauration', commune: 'Dumbéa', imageUrl: null, originalPriceXpf: 2600, promoPriceXpf: 2100,
      discountPercent: 19, publishedUntil: '2027-12-31T12:00:00+11:00', ctaLabel: 'Voir le bon plan', ctaUrl: null,
    },
    {
      id: 'demo-promo-bien-etre', title: 'Pause bien-être', description: 'Un moment de détente à réserver auprès de l’établissement.',
      businessName: 'Atelier douceur (démo)', businessSlug: 'atelier-douceur-demo', businessInitials: 'AD', businessLogoUrl: null,
      verified: false, category: 'Bien-être', commune: 'Mont-Dore', imageUrl: null, originalPriceXpf: 7500, promoPriceXpf: 5900,
      discountPercent: 21, publishedUntil: '2027-12-31T12:00:00+11:00', ctaLabel: 'Consulter l’offre', ctaUrl: null,
    },
    {
      id: 'demo-promo-maison', title: 'Sélection pour la maison', description: 'Des objets utiles issus d’une collection en fin de série.',
      businessName: 'Intérieur insulaire (démo)', businessSlug: 'interieur-insulaire-demo', businessInitials: 'II', businessLogoUrl: null,
      verified: true, category: 'Maison', commune: 'Païta', imageUrl: null, originalPriceXpf: 12500, promoPriceXpf: 8900,
      discountPercent: 29, publishedUntil: '2027-12-31T12:00:00+11:00', ctaLabel: 'Profiter de l’offre', ctaUrl: null,
    },
  ],
  businesses: [
    { name: 'Marché du quartier (démo)', slug: 'marche-quartier-demo', logoUrl: null, badge: 'Commerce vérifié' },
    { name: 'Table du lagon (démo)', slug: 'table-lagon-demo', logoUrl: null, badge: 'Commerce vérifié' },
    { name: 'Atelier douceur (démo)', slug: 'atelier-douceur-demo', logoUrl: null, badge: null },
    { name: 'Intérieur insulaire (démo)', slug: 'interieur-insulaire-demo', logoUrl: null, badge: 'Commerce vérifié' },
  ],
  events: [
    {
      id: 'demo-event-artisans', title: 'Rencontre avec les artisans', description: 'Créateurs et savoir-faire locaux réunis le temps d’une journée.',
      dateIso: '2027-02-06T09:00:00+11:00', time: '09:00', endTime: '17:00', commune: 'Nouméa', venue: 'Maison de quartier',
      category: 'Marché', organizerName: 'Collectif local (démo)', verified: true, isFree: true, priceXpf: 0, bookingUrl: null, coverImageUrl: null,
    },
    {
      id: 'demo-event-musique', title: 'Soirée musique du Pacifique', description: 'Une scène ouverte consacrée aux artistes du territoire.',
      dateIso: '2027-02-13T18:30:00+11:00', time: '18:30', endTime: '22:00', commune: 'Dumbéa', venue: 'Centre culturel',
      category: 'Concert', organizerName: 'Scène du Caillou (démo)', verified: true, isFree: false, priceXpf: 2500, bookingUrl: null, coverImageUrl: null,
    },
    {
      id: 'demo-event-famille', title: 'Matinée découverte en famille', description: 'Des ateliers accessibles aux petits comme aux grands.',
      dateIso: '2027-02-20T08:30:00+11:00', time: '08:30', endTime: '12:00', commune: 'Païta', venue: 'Parc municipal',
      category: 'Famille', organizerName: 'Association du parc (démo)', verified: false, isFree: true, priceXpf: 0, bookingUrl: null, coverImageUrl: null,
    },
    {
      id: 'demo-event-sport', title: 'Initiation sportive en plein air', description: 'Une séance collective encadrée, ouverte aux débutants.',
      dateIso: '2027-02-27T07:00:00+11:00', time: '07:00', endTime: '10:00', commune: 'Mont-Dore', venue: 'Bord de mer',
      category: 'Sport', organizerName: 'Bouger ensemble (démo)', verified: true, isFree: true, priceXpf: 0, bookingUrl: null, coverImageUrl: null,
    },
  ],
}
