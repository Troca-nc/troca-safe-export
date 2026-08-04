// src/types/seo.types.ts

export interface SeoMeta {
  title:       string
  description: string
  keywords?:   string[]
  canonical?:  string
  og: {
    title:       string
    description: string
    image?:      string
    type:        'website' | 'article' | 'product'
    url?:        string
    locale:      string
  }
  twitter?: {
    card:        'summary' | 'summary_large_image'
    title:       string
    description: string
    image?:      string
  }
  schema?: Record<string, unknown>
  noindex?: boolean
}

export interface SitemapEntry {
  url:        string
  lastmod:    string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority:   number
  images?:    { url: string; title?: string; caption?: string }[]
}

export const CATEGORIES_SEO: Record<string, { label: string; description: string; emoji: string }> = {
  vehicules: { label: 'VÃ©hicules', description: 'Voitures, motos, bateaux et engins en Nouvelle-CalÃ©donie', emoji: '=ï¿½' },
  immobilier: { label: 'Immobilier', description: 'Vente et location de biens immobiliers en NC', emoji: 'ð­' },
  location_courte_duree: {
    label: 'Locations courte durï¿½e',
    description: 'Locations saisonniï¿½res, bungalows et sï¿½jours courts en NC',
    emoji: 'ð­',
  },
  electronique: { label: 'ï¿½lectronique', description: 'Tï¿½lï¿½phones, ordinateurs, TV et appareils ï¿½lectroniques', emoji: '=ï¿½' },
  emploi: { label: 'Emploi', description: "Offres et demandes d'emploi en Nouvelle-CalÃ©donie", emoji: '=ï¿½' },
  mobilier: { label: 'Mobilier & Dï¿½co', description: 'Meubles, dï¿½coration et objets de maison', emoji: '=ï¿½' },
  'sports-loisirs': { label: 'Sports & Loisirs', description: 'ï¿½quipements sportifs et articles de loisirs', emoji: 'ð­' },
  animaux: { label: 'Animaux', description: 'Animaux de compagnie et accessoires', emoji: '=>' },
  vetements: { label: 'Vï¿½tements & Mode', description: 'Habits, chaussures et accessoires de mode', emoji: '=U' },
  services: { label: 'Services', description: 'Prestations de services en Nouvelle-CalÃ©donie', emoji: '=ï¿½' },
  don: { label: 'Dons', description: 'Objets gratuits donnï¿½s par des particuliers en NC', emoji: 'ð­' },
  autres: { label: 'Autres', description: 'Toutes les autres annonces en NC', emoji: '(' },
}
export const SITE_URL     = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalico.nc'
export const SITE_NAME    = 'Kalico'
export const SITE_LOCALE  = 'fr_NC'
export const SITE_TWITTER = '@KalicoNC'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`
