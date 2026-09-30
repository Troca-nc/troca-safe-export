// Chiffres de la plateforme affichés dans les pages marketing.
// provisional: true = valeur d'exemple issue des maquettes. À vérifier avant lancement.
// check-design.mjs --launch échoue tant qu'une entrée reste provisoire.
export const placeholders = {
  membres: { value: '18 406', provisional: true, source: 'GET /api/stats/members' },
  visitesMois: { value: '212 000', provisional: true, source: 'outil d\u2019analyse, 30 derniers jours' },
  partMobile: { value: '78 %', provisional: true, source: 'outil d\u2019analyse, 30 derniers jours' },
  annoncesEnLigne: { value: '12 482', provisional: true, source: 'GET /api/stats/listings' },
  prosVerifies: { value: '642', provisional: true, source: 'GET /api/stats/pros' },
  annoncesTroc: { value: '214', provisional: true, source: 'GET /api/stats/listings?type=troc' },
} as const;

export type PlaceholderKey = keyof typeof placeholders;
