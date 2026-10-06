import type { PublishingDraft } from '@/types/publishing'

export type MissingField = { key: keyof PublishingDraft | 'photos'; label: string }

const required = (condition: boolean, key: MissingField['key'], label: string): MissingField[] => condition ? [{ key, label }] : []

export function validatePublishingStep(draft: PublishingDraft, stepId: string, photoCount: number): MissingField[] {
  switch (stepId) {
    case 'photos':
      return required(photoCount < 1, 'photos', 'Ajoutez au moins une photo')
    case 'details':
      return [
        ...required(!draft.title.trim(), 'title', 'Titre'),
        ...required(!draft.categoryId, 'categoryId', 'Catégorie'),
        ...required(draft.description.trim().length < 10, 'description', 'Description de 10 caractères minimum'),
      ]
    case 'price':
      return required(Number(draft.priceXpf) <= 0, 'priceXpf', 'Prix supérieur à zéro')
    case 'exchange':
      return [
        ...required(Number(draft.priceXpf) <= 0, 'priceXpf', 'Valeur estimée supérieure à zéro'),
        ...required(draft.trocWants.length === 0, 'trocWants', 'Au moins une catégorie recherchée'),
      ]
    case 'location':
      return required(!draft.communeId, 'communeId', 'Commune')
    case 'offer': {
      const priceMissing = draft.discountMode === 'strikethrough'
        ? Number(draft.originalPriceXpf) <= 0 || Number(draft.promoPriceXpf) <= 0
        : false
      return [
        ...required(!draft.title.trim(), 'title', 'Titre de l’offre'),
        ...required(!draft.businessName.trim(), 'businessName', 'Commerce'),
        ...required(draft.description.trim().length < 10, 'description', 'Description de 10 caractères minimum'),
        ...required(draft.discountMode === 'percentage' && Number(draft.discountPercent) <= 0, 'discountPercent', 'Pourcentage de réduction'),
        ...required(priceMissing, 'originalPriceXpf', 'Prix habituel et prix remisé'),
        ...required(draft.discountMode === 'gift' && !draft.giftDescription.trim(), 'giftDescription', 'Avantage offert'),
      ]
    }
    case 'validity':
      return [
        ...required(!draft.validFrom, 'validFrom', 'Date de début'),
        ...required(!draft.validUntil, 'validUntil', 'Date de fin'),
        ...required(Boolean(draft.validFrom && draft.validUntil && draft.validUntil < draft.validFrom), 'validUntil', 'Une date de fin postérieure au début'),
        ...required(!draft.contactEmail.includes('@'), 'contactEmail', 'Adresse e-mail valide'),
      ]
    case 'store':
      return [
        ...required(draft.channel !== 'online' && !draft.address.trim(), 'address', 'Adresse du commerce'),
        ...required(draft.channel !== 'online' && !draft.communeId, 'communeId', 'Commune'),
        ...required(draft.channel !== 'store' && !/^https?:\/\//i.test(draft.websiteUrl), 'websiteUrl', 'Lien commençant par http:// ou https://'),
      ]
    case 'route':
      return [
        ...required(!draft.departureCommuneId, 'departureCommuneId', 'Commune de départ'),
        ...required(!draft.destinationCommuneId, 'destinationCommuneId', 'Commune d’arrivée'),
        ...required(Boolean(draft.departureCommuneId && draft.departureCommuneId === draft.destinationCommuneId), 'destinationCommuneId', 'Une arrivée différente du départ'),
      ]
    case 'schedule':
      return [
        ...required(!draft.rideDate, 'rideDate', 'Date de départ'),
        ...required(!draft.rideTime, 'rideTime', 'Heure de départ'),
        ...required(draft.frequency === 'weekly' && draft.recurrenceDays.length === 0, 'recurrenceDays', 'Au moins un jour de répétition'),
      ]
    case 'seats':
      return [
        ...required(Number(draft.seats) < 1 || Number(draft.seats) > 8, 'seats', 'Entre 1 et 8 places'),
        ...required(Number(draft.priceXpf) < 0, 'priceXpf', 'Participation positive ou nulle'),
      ]
    case 'vehicle':
      return [
        ...required(!draft.vehicle.trim(), 'vehicle', 'Véhicule'),
        ...required(draft.description.trim().length < 10, 'description', 'Description de 10 caractères minimum'),
      ]
    case 'event-info':
      return [
        ...required(!draft.title.trim(), 'title', 'Nom de l’événement'),
        ...required(!draft.organizerName.trim(), 'organizerName', 'Organisateur'),
        ...required(draft.description.trim().length < 10, 'description', 'Programme de 10 caractères minimum'),
      ]
    case 'event-place':
      return [
        ...required(!draft.eventDate, 'eventDate', 'Date'),
        ...required(!draft.eventTime, 'eventTime', 'Heure de début'),
        ...required(!draft.venueName.trim(), 'venueName', 'Lieu'),
        ...required(!draft.communeId, 'communeId', 'Commune'),
      ]
    case 'event-access':
      return [
        ...required(draft.eventAccess === 'paid' && Number(draft.priceXpf) <= 0, 'priceXpf', 'Prix d’entrée'),
        ...required(draft.eventAccess === 'registration' && !/^https?:\/\//i.test(draft.bookingUrl), 'bookingUrl', 'Lien d’inscription valide'),
      ]
    default:
      return []
  }
}
