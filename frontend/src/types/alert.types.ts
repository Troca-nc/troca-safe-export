// src/types/alert.types.ts

export type AlertFrequency = 'immediate' | 'daily' | 'weekly'
export type AlertStatus    = 'active' | 'paused' | 'deleted'

export interface AlertFilters {
  q?:           string      // recherche texte
  categorie?:   string      // libell� cat�gorie
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
  label:       string         // ex: "Toyota Hilux Noum�a"
  filters:     AlertFilters
  frequency:   AlertFrequency
  status:      AlertStatus
  nb_results:  number         // nb annonces au moment de la cr�ation
  last_sent_at: string | null
  created_at:  string
  unsubscribe_token: string   // token unique pour se d�sabonner sans login
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

// Payload cr�ation
export interface CreateAlertPayload {
  label?:     string          // optionnel - auto-g�n�r� si absent
  filters:    AlertFilters
  frequency:  AlertFrequency
}

// R�ponse API
export interface AlertsResponse {
  data:  SearchAlert[]
  total: number
}

// Fr�quences disponibles
export const FREQUENCY_OPTIONS: { value: AlertFrequency; label: string; description: string }[] = [
  { value: 'immediate', label: 'Imm�diat',    description: 'D�s qu\'une annonce correspond' },
  { value: 'daily',     label: 'Quotidien',   description: 'R�sum� chaque matin � 8h' },
  { value: 'weekly',    label: 'Hebdomadaire',description: 'R�sum� chaque lundi matin' },
]

// G�n�re un label lisible depuis les filtres
export function buildAlertLabel(filters: AlertFilters): string {
  const parts: string[] = []
  if (filters.q) parts.push(filters.q)
  if (filters.categorie) parts.push(filters.categorie)
  else if (filters.categorie_id) parts.push(`Cat�gorie ${filters.categorie_id}`)
  if (filters.commune) parts.push(filters.commune)
  else if (filters.commune_id) parts.push(`Commune ${filters.commune_id}`)
  if (filters.condition) {
    const conditionLabel = {
      new: 'Neuf',
      like_new: 'Comme neuf',
      good: 'Bon �tat',
      fair: 'Correct',
      for_parts: 'Pour pi�ces',
    }[filters.condition]
    parts.push(conditionLabel || filters.condition)
  }
  if (filters.troc === 'true' || filters.troc === '1') parts.push('Troc')
  if (filters.prix_max) parts.push(`< ${filters.prix_max.toLocaleString('fr-FR')} XPF`)
  return parts.join(' � ') || 'Toutes les annonces'
}
