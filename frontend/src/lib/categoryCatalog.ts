export type CategoryNode = {
  id: string
  name: string
  slug: string
  icon?: string
  subcategories?: CategoryNode[]
}

export const FALLBACK_CATEGORIES: CategoryNode[] = [
  {
    id: 'emploi',
    name: 'Emploi',
    slug: 'emploi',
    icon: '✦',
    subcategories: [
      { id: 'offres-emploi', name: "Offres d'emploi", slug: 'offres-emploi' },
      { id: 'formations-professionnelles', name: 'Formations professionnelles', slug: 'formations-professionnelles' },
    ],
  },
  {
    id: 'vehicules',
    name: 'Véhicules',
    slug: 'vehicules',
    icon: '◢',
    subcategories: [
      { id: 'voitures', name: 'Voitures', slug: 'voitures' },
      { id: 'motos', name: 'Motos', slug: 'motos' },
      { id: 'caravaning', name: 'Caravaning', slug: 'caravaning' },
      { id: 'utilitaires', name: 'Utilitaires', slug: 'utilitaires' },
      { id: 'camions', name: 'Camions', slug: 'camions' },
      { id: 'nautisme', name: 'Nautisme', slug: 'nautisme' },
      { id: 'equipement-auto', name: 'Équipement auto', slug: 'equipement-auto' },
      { id: 'equipement-moto', name: 'Équipement moto', slug: 'equipement-moto' },
      { id: 'equipement-caravaning', name: 'Équipement caravaning', slug: 'equipement-caravaning' },
      { id: 'equipement-nautisme', name: 'Équipement nautisme', slug: 'equipement-nautisme' },
    ],
  },
  {
    id: 'immobilier',
    name: 'Immobilier',
    slug: 'immobilier',
    icon: '⌂',
    subcategories: [
      { id: 'ventes-immobilieres', name: 'Ventes immobilières', slug: 'ventes-immobilieres' },
      { id: 'locations', name: 'Locations', slug: 'locations' },
      { id: 'colocations', name: 'Colocations', slug: 'colocations' },
      { id: 'bureaux-commerces', name: 'Bureaux & Commerces', slug: 'bureaux-commerces' },
    ],
  },
  {
    id: 'location-vacances',
    name: 'Locations de vacances',
    slug: 'location-vacances',
    icon: '🗺',
    subcategories: [
      { id: 'locations-saisonnieres', name: 'Locations saisonnières', slug: 'locations-saisonnieres' },
    ],
  },
  {
    id: 'electronique',
    name: 'Électronique',
    slug: 'electronique',
    icon: '◼',
    subcategories: [
      { id: 'ordinateurs', name: 'Ordinateurs', slug: 'ordinateurs' },
      { id: 'accessoires-informatique', name: 'Accessoires informatique', slug: 'accessoires-informatique' },
      { id: 'tablettes-liseuses', name: 'Tablettes & Liseuses', slug: 'tablettes-liseuses' },
      { id: 'photo-audio-video', name: 'Photo, audio & vidéo', slug: 'photo-audio-video' },
      { id: 'telephones-objets-connectes', name: 'Téléphones & Objets connectés', slug: 'telephones-objets-connectes' },
      { id: 'accessoires-telephones-objets-connectes', name: 'Accessoires téléphone & Objets connectés', slug: 'accessoires-telephones-objets-connectes' },
      { id: 'consoles', name: 'Consoles', slug: 'consoles' },
      { id: 'jeux-video', name: 'Jeux vidéo', slug: 'jeux-video' },
    ],
  },
  {
    id: 'maison-jardin',
    name: 'Maison & Jardin',
    slug: 'maison-jardin',
    icon: '▣',
    subcategories: [
      { id: 'ameublement', name: 'Ameublement', slug: 'ameublement' },
      { id: 'papeterie-fournitures-scolaires', name: 'Papeterie & Fournitures scolaires', slug: 'papeterie-fournitures-scolaires' },
      { id: 'electromenager', name: 'Électroménager', slug: 'electromenager' },
      { id: 'arts-de-la-table', name: 'Arts de la table', slug: 'arts-de-la-table' },
      { id: 'decoration', name: 'Décoration', slug: 'decoration' },
      { id: 'linge-de-maison', name: 'Linge de maison', slug: 'linge-de-maison' },
      { id: 'bricolage', name: 'Bricolage', slug: 'bricolage' },
      { id: 'jardin-plantes', name: 'Jardin & Plantes', slug: 'jardin-plantes' },
    ],
  },
  {
    id: 'famille',
    name: 'Famille',
    slug: 'famille',
    icon: '👪',
    subcategories: [
      { id: 'equipement-bebe', name: 'Équipement bébé', slug: 'equipement-bebe' },
      { id: 'mobilier-enfant', name: 'Mobilier enfant', slug: 'mobilier-enfant' },
      { id: 'vetements-bebe', name: 'Vêtements bébé', slug: 'vetements-bebe' },
    ],
  },
  {
    id: 'mode',
    name: 'Mode',
    slug: 'mode',
    icon: '◍',
    subcategories: [
      { id: 'vetements', name: 'Vêtements', slug: 'vetements' },
      { id: 'chaussures', name: 'Chaussures', slug: 'chaussures' },
      { id: 'accessoires-bagagerie', name: 'Accessoires & Bagagerie', slug: 'accessoires-bagagerie' },
      { id: 'montres-bijoux', name: 'Montres & Bijoux', slug: 'montres-bijoux' },
    ],
  },
  {
    id: 'loisirs',
    name: 'Loisirs',
    slug: 'loisirs',
    icon: '◌',
    subcategories: [
      { id: 'antiquites', name: 'Antiquités', slug: 'antiquites' },
      { id: 'collection', name: 'Collection', slug: 'collection' },
      { id: 'cd-musique', name: 'CD - Musique', slug: 'cd-musique' },
      { id: 'dvd-films', name: 'DVD - Films', slug: 'dvd-films' },
      { id: 'instruments-musique', name: 'Instruments de musique', slug: 'instruments-musique' },
      { id: 'livres', name: 'Livres', slug: 'livres' },
      { id: 'modelisme', name: 'Modélisme', slug: 'modelisme' },
      { id: 'vins-gastronomie', name: 'Vins & Gastronomie', slug: 'vins-gastronomie' },
      { id: 'jeux-jouets', name: 'Jeux & Jouets', slug: 'jeux-jouets' },
      { id: 'loisirs-creatifs', name: 'Loisirs créatifs', slug: 'loisirs-creatifs' },
      { id: 'sport-plein-air', name: 'Sport & Plein air', slug: 'sport-plein-air' },
      { id: 'velos', name: 'Vélos', slug: 'velos' },
      { id: 'equipements-velos', name: 'Équipements vélos', slug: 'equipements-velos' },
    ],
  },
  {
    id: 'animaux',
    name: 'Animaux',
    slug: 'animaux',
    icon: '◔',
    subcategories: [
      { id: 'animaux', name: 'Animaux', slug: 'animaux' },
      { id: 'accessoires-animaux', name: 'Accessoires animaux', slug: 'accessoires-animaux' },
      { id: 'animaux-perdus', name: 'Animaux perdus', slug: 'animaux-perdus' },
    ],
  },
  {
    id: 'materiel-professionnel',
    name: 'Matériel professionnel',
    slug: 'materiel-professionnel',
    icon: '◐',
    subcategories: [
      { id: 'tracteurs', name: 'Tracteurs', slug: 'tracteurs' },
      { id: 'materiel-agricole', name: 'Matériel agricole', slug: 'materiel-agricole' },
      { id: 'btp-gros-oeuvre', name: 'BTP - Chantier gros-oeuvre', slug: 'btp-gros-oeuvre' },
      { id: 'poids-lourds', name: 'Poids lourds', slug: 'poids-lourds' },
      { id: 'manutention-levage', name: 'Manutention - Levage', slug: 'manutention-levage' },
      { id: 'equipements-industriels', name: 'Équipements industriels', slug: 'equipements-industriels' },
      { id: 'equipements-restaurants-hotels', name: 'Équipements pour restaurants & hôtels', slug: 'equipements-restaurants-hotels' },
      { id: 'equipements-bureau', name: 'Équipements & Fournitures de bureau', slug: 'equipements-bureau' },
      { id: 'equipements-commerces-marches', name: 'Équipements pour commerces & marchés', slug: 'equipements-commerces-marches' },
      { id: 'materiel-medical', name: 'Matériel médical', slug: 'materiel-medical' },
    ],
  },
  {
    id: 'services',
    name: 'Services',
    slug: 'services',
    icon: '◐',
    subcategories: [
      { id: 'artistes-musiciens', name: 'Artistes & Musiciens', slug: 'artistes-musiciens' },
      { id: 'baby-sitting', name: 'Baby-Sitting', slug: 'baby-sitting' },
      { id: 'billetterie', name: 'Billetterie', slug: 'billetterie' },
      { id: 'covoiturage', name: 'Covoiturage', slug: 'covoiturage' },
      { id: 'cours-particuliers', name: 'Cours particuliers', slug: 'cours-particuliers' },
      { id: 'entraide-voisins', name: 'Entraide entre voisins', slug: 'entraide-voisins' },
      { id: 'evenements', name: 'Évènements', slug: 'evenements' },
      { id: 'services-a-la-personne', name: 'Services à la personne', slug: 'services-a-la-personne' },
      { id: 'services-aux-animaux', name: 'Services aux animaux', slug: 'services-aux-animaux' },
      { id: 'services-demenagement', name: 'Services de déménagement', slug: 'services-demenagement' },
      { id: 'services-reparations-electroniques', name: 'Services de réparations électroniques', slug: 'services-reparations-electroniques' },
      { id: 'services-reparations-mecaniques', name: 'Services de réparations mécaniques', slug: 'services-reparations-mecaniques' },
      { id: 'services-jardinerie-bricolage', name: 'Services de jardinerie & bricolage', slug: 'services-jardinerie-bricolage' },
      { id: 'services-evenementiels', name: 'Services évènementiels', slug: 'services-evenementiels' },
      { id: 'autres-services', name: 'Autres services', slug: 'autres-services' },
    ],
  },
  {
    id: 'troc',
    name: 'Troc',
    slug: 'troc',
    icon: '⇄',
    subcategories: [
      { id: 'echange', name: 'Échange', slug: 'echange' },
      { id: 'don', name: 'Don', slug: 'don' },
      { id: 'contre-service', name: 'Contre-service', slug: 'contre-service' },
      { id: 'autre-troc', name: 'Autre troc', slug: 'autre-troc' },
    ],
  },
  {
    id: 'divers',
    name: 'Divers',
    slug: 'divers',
    icon: '⋯',
    subcategories: [
      { id: 'autres', name: 'Autres', slug: 'autres' },
    ],
  },
]

export function findCategoryNode(slug: string, categories: CategoryNode[] = FALLBACK_CATEGORIES): CategoryNode | null {
  for (const category of categories) {
    if (category.slug === slug) return category
    for (const sub of category.subcategories || []) {
      if (sub.slug === slug) return sub
    }
  }
  return null
}
