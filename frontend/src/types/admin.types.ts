// src/types/admin.types.ts
export type StatutAnnonce = 'active' | 'expirée' | 'signalée' | 'suspendue' | 'vendue'
export type StatutUser    = 'vérifié' | 'en_attente' | 'suspendu' | 'pro'
export type TypeSignalement = 'arnaque' | 'spam' | 'illicite' | 'haineux' | 'autre'
export type UrgenceSignalement = 'haute' | 'moyenne' | 'basse'
export type ActionModeration = 'supprimer_annonce' | 'suspendre_user' | 'avertir' | 'ignorer'

export interface AdminStats {
  annonces_actives:        number
  annonces_delta_semaine:  number
  utilisateurs_total:      number
  utilisateurs_delta_mois: number
  signalements_attente:    number
  signalements_delta_hier: number
  messages_total:          number
  messages_delta_pct:      number
}

export interface ChartDataPoint { date: string; value: number }
export interface CategoryStat   { nom: string; count: number; pct: number }

export interface AdminAnnonce {
  id: number; titre: string; categorie: string; prix: number | null
  statut: StatutAnnonce; nb_images: number; nb_vues: number
  nb_signalements: number; created_at: string; expires_at: string
  user: { id: number; nom: string; email: string; avatar_url: string | null }
}
export interface AdminAnnoncesResponse { data: AdminAnnonce[]; total: number; page: number; limit: number }

export interface AdminUser {
  id: number; prenom: string; nom: string; email: string
  telephone: string | null; commune: string | null; statut: StatutUser
  telephone_verifie: boolean; nb_annonces: number
  nb_signalements_recus: number; created_at: string
  last_login_at: string | null; avatar_url: string | null
}
export interface AdminUsersResponse { data: AdminUser[]; total: number; page: number; limit: number }

export interface AdminSignalement {
  id: number; type: TypeSignalement; urgence: UrgenceSignalement
  description: string; nb_reporters: number; created_at: string; traite: boolean
  annonce: { id: number; titre: string; prix: number | null; statut: StatutAnnonce }
  user_signalé: { id: number; nom: string; email: string }
  reporters: { id: number; nom: string }[]
}
export interface AdminSignalementsResponse { data: AdminSignalement[]; total: number; en_attente: number }

export interface ModerationActionPayload {
  signalement_id: number; action: ActionModeration; raison?: string; duree_jours?: number
}
export interface ModerationActionResponse { success: boolean; message: string }

export interface AnnoncesFilters {
  search?: string; statut?: StatutAnnonce | 'toutes'; categorie?: string
  page: number; limit: number; sort: 'created_at' | 'nb_vues' | 'nb_signalements'; order: 'asc' | 'desc'
}
export interface UsersFilters {
  search?: string; statut?: StatutUser | 'tous'
  page: number; limit: number; sort: 'created_at' | 'nb_annonces' | 'last_login_at'; order: 'asc' | 'desc'
}
export interface SignalementsFilters { type?: TypeSignalement | 'tous'; urgence?: UrgenceSignalement | 'toutes'; traite?: boolean }
