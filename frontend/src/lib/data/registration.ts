import { DEMO } from '@/lib/demo'
import { metaApi, proApi } from '@/lib/api'
import { getProPlans } from '@/lib/data/pro-offers'
import { planFeatureHighlights } from '@/lib/proOffersPresentation'
import type {
  ProfessionalRegistrationProfile,
  RegistrationCommune,
  RegistrationErrorPresentation,
  RegistrationOffer,
} from '@/types/registration'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {}
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export const registrationSectors = [
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
] as const

export async function getRegistrationCommunes(): Promise<RegistrationCommune[]> {
  if (DEMO) {
    const fixture = await import('@/demo/fixtures/registration')
    return fixture.registrationCommunes
  }

  const response = await metaApi.getCommunes()
  const root = asRecord(response.data)
  const rows = Array.isArray(root.data) ? root.data : []
  return rows
    .map((row) => {
      const item = asRecord(row)
      return {
        id: asNumber(item.id),
        name: asText(item.name) || asText(item.nom),
      }
    })
    .filter((item) => item.id > 0 && item.name)
}

export async function getRegistrationOffers(): Promise<RegistrationOffer[]> {
  const plans = await getProPlans()
  const free = plans.find((plan) => plan.id === 'free')
  const pro = plans.find((plan) => plan.id === 'pro')
  if (!free || !pro) throw new Error('Le catalogue des offres est indisponible.')

  return [
    {
      id: 'free',
      name: free.name,
      priceXpf: free.monthlyPriceXpf,
      cadence: 'sans limite de durée',
      features: planFeatureHighlights(free),
    },
    {
      id: 'pro-monthly',
      name: `${pro.name} mensuel`,
      priceXpf: pro.monthlyPriceXpf,
      cadence: 'par mois',
      features: planFeatureHighlights(pro),
      recommended: true,
    },
    {
      id: 'pro-yearly',
      name: `${pro.name} annuel`,
      priceXpf: pro.yearlyPriceXpf,
      cadence: 'par an',
      features: [...planFeatureHighlights(pro), 'Facturation annuelle'],
    },
  ]
}

export async function saveProfessionalRegistration(profile: ProfessionalRegistrationProfile) {
  await proApi.updateProfile({
    company_name: profile.companyName,
    category: profile.sector,
    commune: profile.commune,
    phone: profile.phone,
    siret: profile.ridet,
  })
}

export function describeRegistrationError(error: unknown): RegistrationErrorPresentation {
  const response = asRecord(asRecord(error).response)
  const data = asRecord(response.data)
  const status = asNumber(response.status)
  const raw = asText(data.error) || asText(asRecord(error).message)
  const normalized = raw.toLocaleLowerCase('fr-FR')

  if (status === 409 || normalized.includes('email') && normalized.includes('utilis')) {
    return {
      message: 'Cet e-mail est déjà utilisé. Connectez-vous ou choisissez une autre adresse.',
      retryable: false,
      emailAlreadyUsed: true,
    }
  }
  if (normalized.includes('network') || normalized.includes('fetch') || normalized.includes('timeout') || normalized.includes('connexion')) {
    return {
      message: 'Connexion impossible. Vérifiez votre réseau puis réessayez.',
      retryable: true,
    }
  }
  return {
    message: raw || 'Impossible de poursuivre l’inscription pour le moment.',
    retryable: true,
  }
}
