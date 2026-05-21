// src/lib/seoHelpers.ts
// ── Générateurs de metadata Next.js 14 pour chaque type de page ───────────────

import type { Metadata } from 'next'
import {
  SITE_URL, SITE_NAME, SITE_LOCALE, SITE_TWITTER,
  DEFAULT_OG_IMAGE, CATEGORIES_SEO,
} from '@/types/seo.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1).trimEnd() + '…'
}

function formatXPF(price: number): string {
  return price.toLocaleString('fr-FR') + ' XPF'
}

// ── Page d'accueil ────────────────────────────────────────────────────────────

export function generateHomeMetadata(): Metadata {
  const title       = 'Troca — Petites annonces Nouvelle-Calédonie'
  const description = 'La plateforme de petites annonces dédiée à la Nouvelle-Calédonie. Achetez, vendez, louez : véhicules, immobilier, électronique, emploi et plus encore à Nouméa et en NC.'

  return {
    title,
    description,
    keywords: ['annonces', 'petites annonces', 'Nouvelle-Calédonie', 'Nouméa', 'vente', 'achat', 'NC', 'troca'],
    alternates: { canonical: SITE_URL },
    openGraph: {
      title,
      description,
      url:       SITE_URL,
      siteName:  SITE_NAME,
      locale:    SITE_LOCALE,
      type:      'website',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Troca — Petites annonces NC' }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [DEFAULT_OG_IMAGE],
      site:        SITE_TWITTER,
    },
  }
}

// ── Page catégorie ────────────────────────────────────────────────────────────

export function generateCategoryMetadata(
  slug: string,
  nb_annonces: number,
  commune?: string,
): Metadata {
  const cat   = CATEGORIES_SEO[slug]
  const label = cat?.label ?? slug

  const location = commune ? ` à ${commune}` : ' en Nouvelle-Calédonie'
  const title     = `${label}${location} — ${nb_annonces} annonces | Troca`
  const description = truncate(
    `${nb_annonces} annonces de ${label.toLowerCase()}${location}. ${cat?.description ?? ''} Troca, la plateforme de petites annonces NC.`,
    160,
  )
  const url = `${SITE_URL}/annonces/categorie/${slug}${commune ? `?commune=${encodeURIComponent(commune)}` : ''}`

  return {
    title,
    description,
    keywords: [label, 'annonces', 'Nouvelle-Calédonie', slug, commune ?? 'NC', 'Troca'].filter(Boolean),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale:   SITE_LOCALE,
      type:     'website',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card:   'summary',
      title,
      description,
      site:   SITE_TWITTER,
    },
  }
}

// ── Page annonce individuelle ─────────────────────────────────────────────────

interface AnnonceMetaInput {
  id:          number
  titre:       string
  description: string
  prix:        number | null
  categorie:   string
  commune:     string | null
  images:      { url: string; thumbnail_url: string }[]
  user: {
    prenom:    string
    verifie:   boolean
  }
  created_at:  string
  updated_at:  string
}

export function generateAnnonceMetadata(annonce: AnnonceMetaInput): Metadata {
  const prix_str  = annonce.prix ? ` — ${formatXPF(annonce.prix)}` : ''
  const lieu_str  = annonce.commune ? ` à ${annonce.commune}` : ' en NC'
  const cat       = CATEGORIES_SEO[annonce.categorie]

  const title       = truncate(`${annonce.titre}${prix_str}${lieu_str} | Troca`, 60)
  const description = truncate(
    annonce.description.replace(/\n+/g, ' ').trim() ||
    `${annonce.titre} en vente${lieu_str}. ${cat?.description ?? ''}`,
    155,
  )
  const url         = `${SITE_URL}/annonces/${annonce.id}`
  const image       = annonce.images[0]?.url ?? DEFAULT_OG_IMAGE

  // JSON-LD : schema.org/Product pour les annonces avec prix
  const schemaProduct = annonce.prix ? {
    '@context':   'https://schema.org',
    '@type':      'Product',
    name:         annonce.titre,
    description,
    image:        annonce.images.map(i => i.url),
    url,
    offers: {
      '@type':       'Offer',
      price:         annonce.prix,
      priceCurrency: 'XPF',
      availability:  'https://schema.org/InStock',
      seller: {
        '@type': 'Person',
        name:    annonce.user.prenom,
      },
    },
  } : null

  // JSON-LD : BreadcrumbList
  const schemaBreadcrumb = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil',       item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: cat?.label ?? annonce.categorie, item: `${SITE_URL}/annonces/categorie/${annonce.categorie}` },
      { '@type': 'ListItem', position: 3, name: annonce.titre,   item: url },
    ],
  }

  return {
    title,
    description,
    keywords: [
      annonce.titre,
      cat?.label ?? annonce.categorie,
      annonce.commune ?? 'NC',
      'Nouvelle-Calédonie',
      'Troca',
      annonce.prix ? formatXPF(annonce.prix) : null,
    ].filter(Boolean) as string[],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName:    SITE_NAME,
      locale:      SITE_LOCALE,
      type:        'article',
      publishedTime: annonce.created_at,
      modifiedTime:  annonce.updated_at,
      images: annonce.images.length > 0
        ? annonce.images.slice(0, 4).map(img => ({
            url:    img.url,
            width:  1280,
            height: 960,
            alt:    annonce.titre,
          }))
        : [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [image],
      site:        SITE_TWITTER,
    },
    other: {
      // JSON-LD injecté via generateJsonLd() dans le layout
      'schema:product':    schemaProduct    ? JSON.stringify(schemaProduct)    : '',
      'schema:breadcrumb': JSON.stringify(schemaBreadcrumb),
    },
  }
}

// ── Page profil utilisateur ───────────────────────────────────────────────────

export function generateProfilMetadata(user: {
  prenom: string; nom: string; nb_annonces: number; commune?: string
}, profileUrl: string = `${SITE_URL}/profil`): Metadata {
  const name  = `${user.prenom} ${user.nom}`
  const title = `${name} — ${user.nb_annonces} annonce${user.nb_annonces > 1 ? 's' : ''} sur Troca`
  const description = `Consultez les ${user.nb_annonces} annonce${user.nb_annonces > 1 ? 's' : ''} de ${name}${user.commune ? ` à ${user.commune}` : ''} sur Troca, la plateforme de petites annonces NC.`

  return {
    title,
    description,
    // Les profils utilisateurs sont indexés mais avec priorité basse
    robots: { index: true, follow: true, 'max-snippet': 80 },
    openGraph: {
      title,
      description,
      url: profileUrl,
      siteName: SITE_NAME,
      locale:   SITE_LOCALE,
      type:     'profile',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
      site: SITE_TWITTER,
    },
  }
}

// ── Pages privées (noindex) ───────────────────────────────────────────────────

export function generateNoindexMetadata(title: string): Metadata {
  return {
    title: `${title} | Troca`,
    robots: { index: false, follow: false },
  }
}
