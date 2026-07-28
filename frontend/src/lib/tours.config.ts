// lib/tours.config.ts
//
// Deux parcours indépendants :
// - Particulier : 7 tours
// - Pro : 11 tours, dont 4 exclusivement pro
//
// Les clés sont communes entre les deux parcours quand le sujet est le même ;
// la persistance est scoppée côté hook avec `accountType:tourKey`.

export type TourStep = {
  title: string
  description: string
}

export type TourDefinition = {
  key: string
  icon: string
  eyebrow: string
  steps: TourStep[]
}

export const TOURS: Record<string, TourDefinition> = {
  annonces: {
    key: 'annonces',
    icon: '📰',
    eyebrow: 'Découvrir Kalico',
    steps: [
      {
        title: 'Parcourez les annonces locales',
        description: 'Repérez rapidement ce qui se vend près de chez vous avec les infos essentielles en avant.',
      },
      {
        title: 'Filtrez selon votre besoin',
        description: 'Catégorie, commune et prix vous aident à trouver l’annonce la plus pertinente.',
      },
      {
        title: 'Contactez le vendeur directement',
        description: 'Tout reste simple pour poser une question ou lancer l’échange sans friction.',
      },
    ],
  },
  troc: {
    key: 'troc',
    icon: '🔁',
    eyebrow: 'Découvrir Kalico',
    steps: [
      {
        title: 'Échangez vos objets en local',
        description: 'Publiez ce que vous n’utilisez plus et trouvez une seconde vie à ce qui vous intéresse.',
      },
      {
        title: 'Comparez les propositions',
        description: 'Les échanges restent clairs, avec une approche simple et rapide pour les deux parties.',
      },
      {
        title: 'Finalisez sans perdre de temps',
        description: 'Messagerie et historique vous aident à garder les échanges bien organisés.',
      },
    ],
  },
  bons_plans: {
    key: 'bons_plans',
    icon: '🏷️',
    eyebrow: 'Bons plans',
    steps: [
      {
        title: 'Trouvez des offres et promos locales',
        description: 'Les bons plans mettent en avant les réductions, avantages et éditions limitées du moment.',
      },
      {
        title: 'Suivez les campagnes visibles',
        description: 'Les annonces sponsorisées remontent là où les habitants regardent en premier.',
      },
      {
        title: 'Gardez un œil sur les nouveautés',
        description: 'Vous voyez plus vite ce qui mérite une visite ou une réservation.',
      },
    ],
  },
  evenementiel: {
    key: 'evenementiel',
    icon: '🎉',
    eyebrow: 'Événements',
    steps: [
      {
        title: 'Repérez les événements du territoire',
        description: 'Concerts, ateliers, marchés ou soirées : tout se découvre au même endroit.',
      },
      {
        title: 'Touchez la bonne commune',
        description: 'Les informations locales aident à savoir rapidement si l’événement vous concerne.',
      },
      {
        title: 'Passez à l’action sans détour',
        description: 'Chaque fiche est pensée pour vous permettre de décider vite.',
      },
    ],
  },
  covoiturage: {
    key: 'covoiturage',
    icon: '🚗',
    eyebrow: 'Covoiturage',
    steps: [
      {
        title: 'Trouvez un trajet partagé',
        description: 'Repérez un départ proche de chez vous et une arrivée qui colle à votre besoin.',
      },
      {
        title: 'Réservez votre place',
        description: 'Les disponibilités visibles en direct simplifient la prise de décision.',
      },
      {
        title: 'Voyagez à moindre coût',
        description: 'Le partage des frais rend les longs trajets plus accessibles pour tous.',
      },
    ],
  },
  fret_livraison: {
    key: 'fret_livraison',
    icon: '📦',
    eyebrow: 'Envoi & Livraison',
    steps: [
      {
        title: 'Déposez une demande d’envoi ou de livraison',
        description: 'Indiquez le trajet, le volume et la date pour lancer la mise en relation.',
      },
      {
        title: 'Comparez les offres reçues',
        description: "Prix en XPF, créneau de prise en charge et avis du transporteur s’affichent clairement.",
      },
      {
        title: 'Suivez votre livraison',
        description: 'Vous gardez l’historique et l’état de la demande dans votre espace.',
      },
    ],
  },
  contacter_pro: {
    key: 'contacter_pro',
    icon: '💬',
    eyebrow: "Appels d'offres",
    steps: [
      {
        title: 'Décrivez votre besoin pour recevoir des devis',
        description: 'Décrivez votre besoin simplement pour obtenir un retour clair et rapide.',
      },
      {
        title: 'Échangez en confiance',
        description: 'La messagerie et les réponses structurées évitent de perdre les informations utiles.',
      },
      {
        title: 'Choisissez le bon professionnel',
        description: 'Comparez facilement les propositions pour avancer sereinement.',
      },
    ],
  },
  vitrine_pro: {
    key: 'vitrine_pro',
    icon: '🏪',
    eyebrow: 'Vitrine Pro',
    steps: [
      {
        title: 'Mettez en avant votre activité',
        description: 'Votre vitrine montre qui vous êtes, ce que vous faites et comment vous joindre.',
      },
      {
        title: 'Rassurez vos futurs clients',
        description: 'Une présentation claire aide à transformer une visite en contact utile.',
      },
      {
        title: 'Diffusez vos preuves sociales',
        description: 'Avis, photos et descriptions donnent envie de vous écrire plutôt qu’un autre.',
      },
    ],
  },
  stocks_pro: {
    key: 'stocks_pro',
    icon: '📦',
    eyebrow: 'Catalogue',
    steps: [
      {
        title: 'Publiez vos produits et vos stocks',
        description: 'Montrez en direct ce qui est disponible sans avoir à mettre à jour plusieurs canaux.',
      },
      {
        title: 'Évitez les allers-retours inutiles',
        description: 'Un stock lisible réduit les échanges répétitifs et accélère la conversion.',
      },
      {
        title: 'Gardez une vue simple de vos produits',
        description: 'Tout reste centralisé pour suivre vos références avec clarté.',
      },
    ],
  },
  calendrier_rdv: {
    key: 'calendrier_rdv',
    icon: '📅',
    eyebrow: 'Rendez-vous',
    steps: [
      {
        title: 'Proposez vos créneaux de rendez-vous',
        description: 'Le calendrier vous permet d’ouvrir des disponibilités visibles par vos clients.',
      },
      {
        title: 'Organisez vos confirmations',
        description: 'Les demandes arrivent au bon endroit pour limiter les oublis.',
      },
      {
        title: 'Gardez un planning lisible',
        description: 'Vous suivez plus facilement ce qui est confirmé, en attente ou livré.',
      },
    ],
  },
  disponibilites_pro: {
    key: 'disponibilites_pro',
    icon: '⏰',
    eyebrow: 'Disponibilités',
    steps: [
      {
        title: 'Annoncez vos disponibilités',
        description: 'Votre activité apparaît plus clairement quand vos horaires sont visibles au bon endroit.',
      },
      {
        title: 'Réduisez les frictions',
        description: 'Les clients savent quand vous êtes joignable avant même de vous écrire.',
      },
      {
        title: 'Restez cohérent sur tous les canaux',
        description: 'Une vue simple des créneaux évite les messages inutiles.',
      },
    ],
  },
  immobilier: {
    key: 'immobilier',
    icon: '🏠',
    eyebrow: 'Découvrir Kalico',
    steps: [
      {
        title: 'Cherchez un bien par zone précise',
        description: 'Province, commune et quartier vous aident à affiner votre recherche sans perte de temps.',
      },
      {
        title: "Contactez directement l'annonceur",
        description: 'La messagerie intégrée garde tout au même endroit pour comparer plus sereinement.',
      },
      {
        title: 'Sauvegardez vos favoris',
        description: 'Revenez dessus plus tard et surveillez les nouvelles annonces similaires.',
      },
    ],
  },
  vehicules: {
    key: 'vehicules',
    icon: '🚙',
    eyebrow: 'Découvrir Kalico',
    steps: [
      {
        title: 'Publiez une voiture ou un deux-roues',
        description: 'Les annonces sont lisibles, avec le prix, la commune et les informations essentielles.',
      },
      {
        title: 'Comparez rapidement les offres',
        description: 'Repérez les annonces les plus pertinentes sans vous perdre dans les détails.',
      },
      {
        title: 'Contactez le vendeur en direct',
        description: 'La prise de contact reste simple pour accélérer la transaction.',
      },
    ],
  },
  construction_artisan: {
    key: 'construction_artisan',
    icon: '🛠️',
    eyebrow: 'Artisanat & BTP',
    steps: [
      {
        title: 'Montrez vos chantiers et vos réalisations',
        description: 'Mettez en avant vos chantiers, votre portfolio et vos spécialités dès la première visite.',
      },
      {
        title: 'Recevez des demandes de devis',
        description: 'Les particuliers détaillent leur besoin et peuvent vous contacter directement depuis Kalico.',
      },
      {
        title: 'Transformez la visite en contact utile',
        description: 'Entre vitrine Pro, devis et prise de rendez-vous, tout est pensé pour générer des prospects.',
      },
    ],
  },
  mecanique_auto: {
    key: 'mecanique_auto',
    icon: '🔧',
    eyebrow: 'Auto / Moto',
    steps: [
      {
        title: 'Présentez vos réparations et entretiens',
        description: 'Un espace clair pour vos services auto, motos et diagnostics.',
      },
      {
        title: 'Faites remonter les demandes utiles',
        description: 'Devis, messages et réservations se regroupent dans un seul tableau de bord.',
      },
      {
        title: 'Gardez les clients informés',
        description: 'Réponses rapides et historique des demandes renforcent la confiance.',
      },
    ],
  },
}

export const PARTICULIER_TOUR_ORDER: string[] = [
  'annonces',
  'troc',
  'bons_plans',
  'evenementiel',
  'covoiturage',
  'fret_livraison',
  'contacter_pro',
]

export const PRO_TOUR_ORDER: string[] = [
  'annonces',
  'troc',
  'bons_plans',
  'evenementiel',
  'covoiturage',
  'fret_livraison',
  'contacter_pro',
  'vitrine_pro',
  'stocks_pro',
  'calendrier_rdv',
  'disponibilites_pro',
]

export const DEFAULT_TOUR_ORDER: string[] = PARTICULIER_TOUR_ORDER

export const CATEGORY_TO_TOUR: Record<string, string> = {
  'Fret / Livraison / Déménagement / Transport': 'fret_livraison',
  'Construction / Artisan / Second oeuvre': 'construction_artisan',
  'Artisan BTP': 'construction_artisan',
  'Mécanique / Réparation auto': 'mecanique_auto',
  'Garage / Auto / Moto': 'mecanique_auto',
  'Location / Vente de véhicules': 'vehicules',
  Véhicules: 'vehicules',
  Événementiel: 'evenementiel',
  'Bon plans & événements': 'bons_plans',
  'Bons Plans': 'bons_plans',
  Services: 'contacter_pro',
  Commerçant: 'stocks_pro',
  Restaurateur: 'vitrine_pro',
  Garagiste: 'mecanique_auto',
  Paysagiste: 'construction_artisan',
  'Prestataire IT': 'vitrine_pro',
  'Agence immobilière': 'immobilier',
  'Activité nautique': 'vitrine_pro',
  Transporteur: 'fret_livraison',
  'Professionnel de santé': 'calendrier_rdv',
  'Organisateur d’événements': 'evenementiel',
  Agriculteur: 'stocks_pro',
  Commerce: 'stocks_pro',
  Restauration: 'vitrine_pro',
  Transport: 'fret_livraison',
  Santé: 'calendrier_rdv',
  BTP: 'construction_artisan',
  Informatique: 'vitrine_pro',
  Plateforme: 'vitrine_pro',
}
