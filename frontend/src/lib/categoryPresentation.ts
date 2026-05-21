import type { ComponentType } from 'react'
import {
  BadgeHelp,
  Briefcase,
  CarFront,
  Dumbbell,
  Handshake,
  Home,
  Layers3,
  MapPin,
  PawPrint,
  Shirt,
  Smartphone,
  Sofa,
  UsersRound,
  Wrench,
} from 'lucide-react'

import type { CategoryNode } from '@/lib/categoryCatalog'

export type CategoryVisual = {
  icon: ComponentType<{ className?: string }>
  label: string
}

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  vehicules: { icon: CarFront, label: 'Véhicules' },
  immobilier: { icon: Home, label: 'Immobilier' },
  'location-vacances': { icon: MapPin, label: 'Location vacances' },
  electronique: { icon: Smartphone, label: 'Électronique' },
  emploi: { icon: Briefcase, label: 'Emploi' },
  'maison-jardin': { icon: Sofa, label: 'Maison & jardin' },
  famille: { icon: UsersRound, label: 'Famille' },
  mode: { icon: Shirt, label: 'Mode' },
  loisirs: { icon: Dumbbell, label: 'Loisirs' },
  animaux: { icon: PawPrint, label: 'Animaux' },
  'materiel-professionnel': { icon: Wrench, label: 'Matériel pro' },
  services: { icon: BadgeHelp, label: 'Services' },
  troc: { icon: Handshake, label: 'Troc' },
  divers: { icon: Layers3, label: 'Divers' },
  mobilier: { icon: Sofa, label: 'Maison & jardin' },
  'sports-loisirs': { icon: Dumbbell, label: 'Loisirs' },
  vetements: { icon: Shirt, label: 'Mode' },
  autres: { icon: Layers3, label: 'Divers' },
}

export const FEATURED_SEARCHES = [
  { label: 'Emploi', slug: 'emploi' },
  { label: 'Véhicules', slug: 'vehicules' },
  { label: 'Immobilier', slug: 'immobilier' },
  { label: 'Location vacances', slug: 'location-vacances' },
  { label: 'Électronique', slug: 'electronique' },
  { label: 'Maison & jardin', slug: 'maison-jardin' },
  { label: 'Famille', slug: 'famille' },
  { label: 'Mode', slug: 'mode' },
  { label: 'Loisirs', slug: 'loisirs' },
  { label: 'Animaux', slug: 'animaux' },
  { label: 'Matériel pro', slug: 'materiel-professionnel' },
  { label: 'Services', slug: 'services' },
  { label: 'Troc', slug: 'troc' },
  { label: 'Divers', slug: 'divers' },
]

export const SEARCH_ALERTS = ['iPhone 15', 'Toyota Hilux', 'Studio Nouméa', 'Canapé', 'PS5', 'Chiot']

export const FEATURED_CATEGORY_ORDER = [
  'emploi',
  'vehicules',
  'immobilier',
  'location-vacances',
  'electronique',
  'maison-jardin',
  'famille',
  'mode',
  'loisirs',
  'animaux',
  'materiel-professionnel',
  'services',
  'troc',
  'divers',
]

export function getCategoryIcon(slug: string) {
  return CATEGORY_VISUALS[slug]?.icon ?? Layers3
}

export function mergeCategories(fallback: CategoryNode[], remote: CategoryNode[]) {
  const merged = new Map<string, CategoryNode>()
  ;[...fallback, ...remote].forEach((cat) => {
    const current = merged.get(cat.slug)
    if (!current) {
      merged.set(cat.slug, cat)
      return
    }

    if ((!current.subcategories || current.subcategories.length === 0) && cat.subcategories?.length) {
      merged.set(cat.slug, { ...current, subcategories: cat.subcategories })
    }
  })

  return Array.from(merged.values())
}

export function getFeaturedCategories(categories: CategoryNode[]) {
  const bySlug = new Map(categories.map((cat) => [cat.slug, cat]))
  return FEATURED_CATEGORY_ORDER.map((slug) => bySlug.get(slug)).filter(Boolean) as CategoryNode[]
}
