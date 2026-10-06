import type { PublishingKind } from '@/types/publishing'

export type PublishingStep = {
  id: string
  label: string
  title: string
  description: string
}

export const PUBLISHING_TYPES: Array<{
  id: PublishingKind
  label: string
  description: string
  info: string
}> = [
  { id: 'sale', label: 'Vente', description: 'Vendez un objet, un véhicule ou un bien entre particuliers.', info: 'Gratuit · sans commission' },
  { id: 'troc', label: 'Troc', description: 'Échangez un objet contre un autre, avec ou sans complément.', info: 'Gratuit · trocomètre inclus' },
  { id: 'bonplan', label: 'Bon plan', description: 'Proposez une promotion ou une offre spéciale de votre commerce.', info: 'Paiement et éligibilité vérifiés au serveur' },
  { id: 'carpool', label: 'Covoiturage', description: 'Proposez des places dans votre véhicule sur un trajet.', info: 'Gratuit · sans commission' },
  { id: 'event', label: 'Événement', description: 'Annoncez un concert, un marché, un tournoi ou un atelier.', info: 'Agenda des communes' },
]

const PUBLICATION: PublishingStep = {
  id: 'publication',
  label: 'Publication',
  title: 'Vérifiez et publiez',
  description: 'Relisez les informations. Vous pourrez les gérer depuis votre compte.',
}

export const PUBLISHING_STEPS: Record<PublishingKind, PublishingStep[]> = {
  sale: [
    { id: 'photos', label: 'Photos', title: 'Ajoutez vos photos', description: 'La première photo sert de couverture dans les résultats.' },
    { id: 'details', label: 'Description', title: 'Décrivez votre objet', description: 'Un titre précis et une description honnête facilitent les échanges.' },
    { id: 'price', label: 'Prix', title: 'Fixez votre prix', description: 'Le montant est affiché en francs pacifiques.' },
    { id: 'location', label: 'Lieu', title: 'Où se fait la remise ?', description: 'La commune apparaît sur l’annonce, jamais votre adresse exacte.' },
    PUBLICATION,
  ],
  troc: [
    { id: 'photos', label: 'Photos', title: 'Ajoutez vos photos', description: 'Montrez clairement l’état réel de l’objet proposé.' },
    { id: 'details', label: 'Description', title: 'Décrivez votre objet', description: 'Ces informations permettent aux autres membres de comparer.' },
    { id: 'exchange', label: 'Échange', title: 'Qu’aimeriez-vous en échange ?', description: 'La valeur et les catégories recherchées alimentent le trocomètre.' },
    { id: 'location', label: 'Lieu', title: 'Où se fait l’échange ?', description: 'La commune est publique, le quartier reste facultatif.' },
    PUBLICATION,
  ],
  bonplan: [
    { id: 'offer', label: 'Offre', title: 'Décrivez l’offre', description: 'Précisez clairement l’avantage proposé par votre commerce.' },
    { id: 'validity', label: 'Validité', title: 'Quand l’offre est-elle valable ?', description: 'Le bon plan disparaît automatiquement après sa période de publication.' },
    { id: 'store', label: 'Où en profiter', title: 'Où en profiter ?', description: 'Indiquez le point de vente, le site, ou les deux.' },
    PUBLICATION,
  ],
  carpool: [
    { id: 'route', label: 'Trajet', title: 'Où allez-vous ?', description: 'Ajoutez les arrêts possibles sans révéler d’adresse personnelle.' },
    { id: 'schedule', label: 'Date et heure', title: 'Quand partez-vous ?', description: 'Un trajet hebdomadaire peut être répété automatiquement.' },
    { id: 'seats', label: 'Places et prix', title: 'Places et participation', description: 'La participation est librement saisie et Kalico ne prélève pas de commission.' },
    { id: 'vehicle', label: 'Véhicule', title: 'Votre véhicule', description: 'Donnez assez d’informations pour être reconnu au rendez-vous.' },
    PUBLICATION,
  ],
  event: [
    { id: 'event-info', label: 'Informations', title: 'Présentez l’événement', description: 'Expliquez en quelques lignes ce que le public va vivre.' },
    { id: 'event-place', label: 'Date et lieu', title: 'Quand et où ?', description: 'L’événement est rangé dans l’agenda de la commune choisie.' },
    { id: 'event-access', label: 'Accès', title: 'Comment y accéder ?', description: 'Indiquez si l’entrée est libre, payante ou sur inscription.' },
    PUBLICATION,
  ],
}

export const CONDITION_OPTIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'like_new', label: 'Très bon état' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'État correct' },
  { value: 'for_parts', label: 'À réparer' },
]

export const BON_PLAN_CATEGORIES = [
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'sport', label: 'Sport et loisirs' },
  { value: 'mode', label: 'Mode' },
  { value: 'maison', label: 'Maison' },
  { value: 'beaute', label: 'Beauté' },
  { value: 'services', label: 'Services' },
  { value: 'voyages', label: 'Tourisme' },
  { value: 'autre', label: 'Autre' },
]

export const EVENT_CATEGORIES = [
  { value: 'concert', label: 'Concert' },
  { value: 'marche', label: 'Marché' },
  { value: 'sport', label: 'Sport' },
  { value: 'festival', label: 'Festival' },
  { value: 'conference', label: 'Atelier ou conférence' },
  { value: 'exposition', label: 'Exposition' },
  { value: 'spectacle', label: 'Spectacle' },
  { value: 'autre', label: 'Autre' },
]
