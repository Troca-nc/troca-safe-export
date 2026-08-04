// src/types/alert.types.ts

export type AlertFrequency = 'immediate' | 'daily' | 'weekly'
export type AlertStatus    = 'active' | 'paused' | 'deleted'

export interface AlertFilters {
  q?:           string      // recherche texte
  categorie?:   string      // libellï¿½ catï¿½gorie
  categorie_id?: string | number
  commune?:     string
  commune_id?:  string | number
  prix_min?:    number
  prix_max?:    number
  condition?:   string
  troc?:        string
  province_id?: string | number
  lat?:         string | number
  lng?:         string | number
  radius?:      number
  [key: string]: string | number | undefined
}

export interface SearchAlert {
  id:          number
  user_id:     number
  label:       string         // ex: "Toyota Hilux NoumÃ©a"
  filters:     AlertFilters
  frequency:   AlertFrequency
  status:      AlertStatus
  nb_results:  number         // nb annonces au moment de la crï¿½ation
  last_sent_at: string | null
  created_at:  string
  unsubscribe_token: string   // token unique pour se dï¿½sabonner sans login
}

export interface AlertMatch {
  alert:    SearchAlert
  annonces: AlertAnnonce[]
}

export interface AlertAnnonce {
  id:          number
  titre:       string
  prix:        number | null
  commune:     string | null
  image_url:   string | null
  created_at:  string
  url:         string
}

// Payload crï¿½ation
export interface CreateAlertPayload {
  label?:     string          // optionnel - auto-gï¿½nï¿½rï¿½ si absent
  filters:    AlertFilters
  frequency:  AlertFrequency
}

// Rï¿½ponse API
export interface AlertsResponse {
  data:  SearchAlert[]
  total: number
}

// Frï¿½quences disponibles
export const FREQUENCY_OPTIONS: { value: AlertFrequency; label: string; description: string }[] = [
  { value: 'immediate', label: 'Immï¿½diat',    description: 'Dï¿½s qu\'une annonce correspond' },
  { value: 'daily',     label: 'Quotidien',   description: 'Rï¿½sumï¿½ chaque matin ï¿½ 8h' },
  { value: 'weekly',    label: 'Hebdomadaire',description: 'Rï¿½sumï¿½ chaque lundi matin' },
]

// Gï¿½nï¿½re un label lisible depuis les filtres
export function buildAlertLabel(filters: AlertFilters): string {
  const parts: string[] = []
  if (filters.q) parts.push(filters.q)
  if (filters.categorie) parts.push(filters.categorie)
  else if (filters.categorie_id) parts.push(`CatÃ©gorie ${filters.categorie_id}`)
  if (filters.commune) parts.push(filters.commune)
  else if (filters.commune_id) parts.push(`Commune ${filters.commune_id}`)
  if (filters.condition) {
    const conditionLabel = {
      new: 'Neuf',
      like_new: 'Comme neuf',
      good: 'Bon Ãtat',
      fair: 'Correct',
      for_parts: 'Pour piï¿½ces',
    }[filters.condition]
    parts.push(conditionLabel || filters.condition)
  }
  if (filters.troc === 'true' || filters.troc === '1') parts.push('Troc')
  if (filters.prix_max) parts.push(`< ${filters.prix_max.toLocaleString('fr-FR')} XPF`)
  return parts.join(' ï¿½ ') || 'Toutes les annonces'
}
