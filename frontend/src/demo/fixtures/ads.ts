import type { AdvertisingPageData, AdvertisingReportExample } from '@/types/advertising'
import { advertisingAudience } from '@/lib/advertisingPresentation'

export const advertisingReportExample: AdvertisingReportExample = {
  label: 'Exemple',
  periodLabel: 'Période fictive de 14 jours',
  campaignLabel: 'Campagne locale de démonstration',
  metrics: [
    { label: 'Impressions', value: '7 240', detail: 'Affichages fictifs' },
    { label: 'Interactions', value: '286', detail: 'Clics fictifs' },
    { label: 'Contacts', value: '21', detail: 'Demandes fictives' },
    { label: 'Taux d’interaction', value: '4,0 %', detail: 'Calcul d’exemple' },
  ],
}

export const demoAdvertisingPageData: AdvertisingPageData = {
  currency: 'XPF',
  audience: advertisingAudience,
  formats: [
    {
      id: 'bon_plan',
      title: 'Bon plan sponsorisé',
      description: 'Placez une offre professionnelle dans la sélection visible depuis l’accueil et l’espace Bons plans.',
      placement: 'Accueil et espace Bons plans',
      targetingLabel: 'Audience générale des Bons plans',
      availabilityLabel: 'Capacité masquée en démonstration',
      concurrentCapacity: null,
      pricingOptions: [],
    },
    {
      id: 'banner',
      title: 'Bannière catégorie',
      description: 'Installez une bannière au-dessus des annonces d’une catégorie choisie depuis votre espace Pro.',
      placement: 'En-tête d’une catégorie',
      targetingLabel: 'Une catégorie Kalico',
      availabilityLabel: 'Capacité masquée en démonstration',
      concurrentCapacity: null,
      pricingOptions: [],
    },
    {
      id: 'popup',
      title: 'Popup homepage',
      description: 'Présentez un message prioritaire dans une fenêtre affichée sur la page d’accueil.',
      placement: 'Fenêtre sur la page d’accueil',
      targetingLabel: 'Audience générale de l’accueil',
      availabilityLabel: 'Capacité masquée en démonstration',
      concurrentCapacity: null,
      pricingOptions: [],
    },
  ],
  estimates: [
    { formatId: 'bon_plan', label: 'Estimation indicative', impressionsMin: 2400, impressionsMax: 4600, contactsMin: 6, contactsMax: 14 },
    { formatId: 'banner', label: 'Estimation indicative', impressionsMin: 3900, impressionsMax: 7200, contactsMin: 9, contactsMax: 20 },
    { formatId: 'popup', label: 'Estimation indicative', impressionsMin: 5800, impressionsMax: 9800, contactsMin: 12, contactsMax: 28 },
  ],
  reportExample: advertisingReportExample,
}
