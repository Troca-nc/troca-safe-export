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
  'vehicules':      { label: 'Véhicules',       description: 'Voitures, motos, bateaux et engins en Nouvelle-Calédonie', emoji: '🚗' },
  'immobilier':     { label: 'Immobilier',       description: 'Vente et location de biens immobiliers en NC',            emoji: '🏠' },
  'location_courte_duree': { label: 'Locations courte durée', description: 'Locations saisonnières, bungalows et séjours courts en NC', emoji: '🏡' },
  'electronique':   { label: 'Électronique',     description: 'Téléphones, ordinateurs, TV et appareils électroniques',  emoji: '📱' },
  'emploi':         { label: 'Emploi',            description: 'Offres et demandes d\'emploi en Nouvelle-Calédonie',     emoji: '💼' },
  'mobilier':       { label: 'Mobilier & Déco',  description: 'Meubles, décoration et objets de maison',                emoji: '🛋️' },
  'sports-loisirs': { label: 'Sports & Loisirs', description: 'Équipements sportifs et articles de loisirs',            emoji: '⚽' },
  'animaux':        { label: 'Animaux',           description: 'Animaux de compagnie et accessoires',                   emoji: '🐾' },
  'vetements':      { label: 'Vêtements & Mode', description: 'Habits, chaussures et accessoires de mode',              emoji: '👗' },
  'services':       { label: 'Services',          description: 'Prestations de services en Nouvelle-Calédonie',         emoji: '🔧' },
  'don':            { label: 'Dons',              description: 'Objets gratuits donnés par des particuliers en NC',      emoji: '🎁' },
  'autres':         { label: 'Autres',            description: 'Toutes les autres annonces en NC',                      emoji: '📦' },
}

export const SITE_URL     = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalico.nc'
export const SITE_NAME    = 'Kalico'
export const SITE_LOCALE  = 'fr_NC'
export const SITE_TWITTER = '@KalicoNC'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`
