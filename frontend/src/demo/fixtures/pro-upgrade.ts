import { demoProOfferPage } from './pro-offers'
import type { ProUpgradePageData } from '@/types/pro-upgrade'

export const demoProUpgradePage: ProUpgradePageData = {
  communes: [
    { id: 101, name: 'Nouméa' },
    { id: 102, name: 'Dumbéa' },
    { id: 103, name: 'Païta' },
    { id: 104, name: 'Mont-Dore' },
  ],
  plans: demoProOfferPage.plans,
  sectors: [
    'Commerçant',
    'Restaurateur',
    'Artisan BTP',
    'Garagiste',
    'Paysagiste',
    'Prestataire IT',
    'Agence immobilière',
    'Activité nautique',
    'Transporteur',
    'Professionnel de santé',
    'Organisateur d’événements',
    'Agriculteur',
  ],
  suggestedDraft: {
    companyName: 'Atelier du Lagon (démo)',
    sector: 'Artisan BTP',
    phone: '75 00 00',
    ridet: '0000000000',
    commune: 'Nouméa',
    presentation: 'Une entreprise locale de démonstration au service des habitants du quartier.',
  },
}
