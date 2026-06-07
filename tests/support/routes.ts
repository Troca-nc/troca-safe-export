export const PUBLIC_PAGES = [
  '/',
  '/annonces',
  '/pros',
  '/appels-offres',
  '/bons-plans',
  '/covoiturage',
  '/troc',
  '/messages',
  '/profil',
  '/contact',
  '/mentions-legales',
  '/politique-de-confidentialite',
  '/politique-cookies',
  '/cgu',
  '/cgv',
] as const

export const PARTICULIER_PAGES = [
  '/annonces/nouvelle',
  '/messages',
  '/troc',
  '/covoiturage',
  '/mes-rdv',
  '/favoris',
  '/alertes',
  '/profil',
  '/parametres',
] as const

export const VENDEUR_PAGES = [
  '/profil?tab=listings',
  '/messages',
  '/parametres',
] as const

export const PRO_PAGES = [
  '/pro/dashboard',
  '/pro/dashboard/annonces',
  '/pro/dashboard/rdv',
  '/pro/dashboard/devis',
  '/pro/dashboard/catalogue',
  '/pro/dashboard/parrainage',
  '/pro/dashboard/auto-reply',
  '/pro/dashboard/pack-lancement',
  '/pro/dashboard/parametres',
  '/pro/dashboard/factures',
] as const

export const CONDUCTEUR_PAGES = [
  '/covoiturage',
  '/covoiturage/reservations',
] as const

export const ADMIN_PAGES = [
  '/admin/dashboard',
  '/admin/users',
  '/admin/annonces',
  '/admin/signalements',
  '/admin/enseignes',
] as const

export const PUBLIC_SCREENSHOT_GROUP = 'public'
export const ROLE_SCREENSHOT_GROUPS = {
  particulier: 'particulier',
  vendeur: 'vendeur',
  pro: 'pro',
  conducteur: 'conducteur',
  admin: 'admin',
} as const
