// lib/tours.config.ts
//
// Deux parcours indpendants :
// - Particulier : 7 tours
// - Pro : 11 tours, dont 4 exclusivement pro
//
// Les cls sont communes entre les deux parcours quand le sujet est le mme ;
// la persistance est scoppe ct hook avec `accountType:tourKey`.

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
    icon: '=',
    eyebrow: 'Découvrir Kalico',
    steps: [
      {
        title: 'Parcourez les annonces locales',
        description: 'Reprez rapidement ce qui se vend prs de chez vous avec les infos essentielles en avant.',
      },
      {
        title: 'Filtrez selon votre besoin',
        description: 'Catégorie, commune et prix vous aident  trouver lannonce la plus pertinente.',
      },
      {
        title: 'Contactez le vendeur directement',
        description: 'Tout reste simple pour poser une question ou lancer lchange sans friction.',
      },
    ],
  },
  troc: {
    key: 'troc',
    icon: '=',
    eyebrow: 'Découvrir Kalico',
    steps: [
      {
        title: 'changez vos objets en local',
        description: 'Publiez ce que vous nutilisez plus et trouvez une seconde vie  ce qui vous intresse.',
      },
      {
        title: 'Comparez les propositions',
        description: 'Les changes restent clairs, avec une approche simple et rapide pour les deux parties.',
      },
      {
        title: 'Finalisez sans perdre de temps',
        description: 'Messagerie et historique vous aident  garder les changes bien organiss.',
      },
    ],
  },
  bons_plans: {
    key: 'bons_plans',
    icon: '🎭',
    eyebrow: 'Bons plans',
    steps: [
      {
        title: 'Trouvez des offres et promos locales',
        description: 'Les bons plans mettent en avant les rductions, avantages et ditions limites du moment.',
      },
      {
        title: 'Suivez les campagnes visibles',
        description: 'Les annonces sponsorises remontent l o les habitants regardent en premier.',
      },
      {
        title: 'Gardez un Sil sur les nouveauts',
        description: 'Vous voyez plus vite ce qui mrite une visite ou une rservation.',
      },
    ],
  },
  evenementiel: {
    key: 'evenementiel',
    icon: '🎭',
    eyebrow: 'vnements',
    steps: [
      {
        title: 'Reprez les vnements du territoire',
        description: 'Concerts, ateliers, marchs ou soires : tout se dcouvre au mme endroit.',
      },
      {
        title: 'Touchez la bonne commune',
        description: 'Les informations locales aident  savoir rapidement si lvnement vous concerne.',
      },
      {
        title: 'Passez  laction sans dtour',
        description: 'Chaque fiche est pense pour vous permettre de dcider vite.',
      },
    ],
  },
  covoiturage: {
    key: 'covoiturage',
    icon: '=',
    eyebrow: 'Covoiturage',
    steps: [
      {
        title: 'Trouvez un trajet partag',
        description: 'Reprez un dpart proche de chez vous et une arrive qui colle  votre besoin.',
      },
      {
        title: 'Rservez votre place',
        description: 'Les disponibilits visibles en direct simplifient la prise de dcision.',
      },
      {
        title: 'Voyagez  moindre cot',
        description: 'Le partage des frais rend les longs trajets plus accessibles pour tous.',
      },
    ],
  },
  fret_livraison: {
    key: 'fret_livraison',
    icon: '=',
    eyebrow: 'Envoi & Livraison',
    steps: [
      {
        title: 'Dposez une demande denvoi ou de livraison',
        description: 'Indiquez le trajet, le volume et la date pour lancer la mise en relation.',
      },
      {
        title: 'Comparez les offres reues',
        description: "Prix en XPF, crneau de prise en charge et avis du transporteur saffichent clairement.",
      },
      {
        title: 'Suivez votre livraison',
        description: 'Vous gardez lhistorique et lÉtat de la demande dans votre espace.',
      },
    ],
  },
  contacter_pro: {
    key: 'contacter_pro',
    icon: '=',
    eyebrow: "Appels d'offres",
    steps: [
      {
        title: 'Dcrivez votre besoin pour recevoir des devis',
        description: 'Dcrivez votre besoin simplement pour obtenir un retour clair et rapide.',
      },
      {
        title: 'changez en confiance',
        description: 'La messagerie et les rponses structures vitent de perdre les informations utiles.',
      },
      {
        title: 'Choisissez le bon professionnel',
        description: 'Comparez facilement les propositions pour avancer sereinement.',
      },
    ],
  },
  vitrine_pro: {
    key: 'vitrine_pro',
    icon: '🎭',
    eyebrow: 'Vitrine Pro',
    steps: [
      {
        title: 'Mettez en avant votre activit',
        description: 'Votre vitrine montre qui vous tes, ce que vous faites et comment vous joindre.',
      },
      {
        title: 'Rassurez vos futurs clients',
        description: 'Une prsentation claire aide  transformer une visite en contact utile.',
      },
      {
        title: 'Diffusez vos preuves sociales',
        description: 'Avis, photos et descriptions donnent envie de vous crire plutt quun autre.',
      },
    ],
  },
  stocks_pro: {
    key: 'stocks_pro',
    icon: '=',
    eyebrow: 'Catalogue',
    steps: [
      {
        title: 'Publiez vos produits et vos stocks',
        description: 'Montrez en direct ce qui est disponible sans avoir  mettre  jour plusieurs canaux.',
      },
      {
        title: 'vitez les allers-retours inutiles',
        description: 'Un stock lisible rduit les changes rptitifs et acclre la conversion.',
      },
      {
        title: 'Gardez une vue simple de vos produits',
        description: 'Tout reste centralis pour suivre vos rfrences avec clart.',
      },
    ],
  },
  calendrier_rdv: {
    key: 'calendrier_rdv',
    icon: '=',
    eyebrow: 'Rendez-vous',
    steps: [
      {
        title: 'Proposez vos crneaux de rendez-vous',
        description: 'Le calendrier vous permet douvrir des disponibilits visibles par vos clients.',
      },
      {
        title: 'Organisez vos confirmations',
        description: 'Les demandes arrivent au bon endroit pour limiter les oublis.',
      },
      {
        title: 'Gardez un planning lisible',
        description: 'Vous suivez plus facilement ce qui est confirm, en attente ou livr.',
      },
    ],
  },
  disponibilites_pro: {
    key: 'disponibilites_pro',
    icon: '',
    eyebrow: 'Disponibilits',
    steps: [
      {
        title: 'Annoncez vos disponibilits',
        description: 'Votre activit apparat plus clairement quand vos horaires sont visibles au bon endroit.',
      },
      {
        title: 'Rduisez les frictions',
        description: 'Les clients savent quand vous tes joignable avant mme de vous crire.',
      },
      {
        title: 'Restez cohrent sur tous les canaux',
        description: 'Une vue simple des crneaux vite les messages inutiles.',
      },
    ],
  },
  immobilier: {
    key: 'immobilier',
    icon: '🎭',
    eyebrow: 'Découvrir Kalico',
    steps: [
      {
        title: 'Cherchez un bien par zone prcise',
        description: 'Province, commune et quartier vous aident  affiner votre recherche sans perte de temps.',
      },
      {
        title: "Contactez directement l'annonceur",
        description: 'La messagerie intgre garde tout au mme endroit pour comparer plus sereinement.',
      },
      {
        title: 'Sauvegardez vos favoris',
        description: 'Revenez dessus plus tard et surveillez les nouvelles annonces similaires.',
      },
    ],
  },
  vehicules: {
    key: 'vehicules',
    icon: '=',
    eyebrow: 'Découvrir Kalico',
    steps: [
      {
        title: 'Publiez une voiture ou un deux-roues',
        description: 'Les annonces sont lisibles, avec le prix, la commune et les informations essentielles.',
      },
      {
        title: 'Comparez rapidement les offres',
        description: 'Reprez les annonces les plus pertinentes sans vous perdre dans les dtails.',
      },
      {
        title: 'Contactez le vendeur en direct',
        description: 'La prise de contact reste simple pour acclrer la transaction.',
      },
    ],
  },
  construction_artisan: {
    key: 'construction_artisan',
    icon: '=',
    eyebrow: 'Artisanat & BTP',
    steps: [
      {
        title: 'Montrez vos chantiers et vos ralisations',
        description: 'Mettez en avant vos chantiers, votre portfolio et vos spcialits ds la premire visite.',
      },
      {
        title: 'Recevez des demandes de devis',
        description: 'Les particuliers dtaillent leur besoin et peuvent vous contacter directement depuis Kalico.',
      },
      {
        title: 'Transformez la visite en contact utile',
        description: 'Entre vitrine Pro, devis et prise de rendez-vous, tout est pens pour gnrer des prospects.',
      },
    ],
  },
  mecanique_auto: {
    key: 'mecanique_auto',
    icon: '🚗',
    eyebrow: 'Auto / Moto',
    steps: [
      {
        title: 'Prsentez vos rparations et entretiens',
        description: 'Un espace clair pour vos services auto, motos et diagnostics.',
      },
      {
        title: 'Faites remonter les demandes utiles',
        description: 'Devis, messages et réservations se regroupent dans un seul tableau de bord.',
      },
      {
        title: 'Gardez les clients informs',
        description: 'Rponses rapides et historique des demandes renforcent la confiance.',
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
  'Fret / Livraison / Dmnagement / Transport': 'fret_livraison',
  'Construction / Artisan / Second oeuvre': 'construction_artisan',
  'Artisan BTP': 'construction_artisan',
  'Mcanique / Rparation auto': 'mecanique_auto',
  'Garage / Auto / Moto': 'mecanique_auto',
  'Location / Vente de vhicules': 'vehicules',
  Véhicules: 'vehicules',
  vnementiel: 'evenementiel',
  'Bon plans & vnements': 'bons_plans',
  'Bons Plans': 'bons_plans',
  Services: 'contacter_pro',
  Commerant: 'stocks_pro',
  Restaurateur: 'vitrine_pro',
  Garagiste: 'mecanique_auto',
  Paysagiste: 'construction_artisan',
  'Prestataire IT': 'vitrine_pro',
  'Agence immobilire': 'immobilier',
  'Activit nautique': 'vitrine_pro',
  Transporteur: 'fret_livraison',
  'Professionnel de sant': 'calendrier_rdv',
  'Organisateur dvnements': 'evenementiel',
  Agriculteur: 'stocks_pro',
  Commerce: 'stocks_pro',
  Restauration: 'vitrine_pro',
  Transport: 'fret_livraison',
  Sant: 'calendrier_rdv',
  BTP: 'construction_artisan',
  Informatique: 'vitrine_pro',
  Plateforme: 'vitrine_pro',
}
