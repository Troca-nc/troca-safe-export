// src/app/annonces/categorie/[categorie]/page.tsx
// ── Page catégorie avec metadata dynamique ─────────────────────────────────

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateCategoryMetadata } from '@/lib/seoHelpers'
import JsonLd, { buildBreadcrumbSchema } from '@/components/seo/JsonLd'
import { CATEGORIES_SEO, SITE_URL } from '@/types/seo.types'

export const revalidate = 1800   // 30 minutes

async function getCategoryStats(slug: string, commune?: string) {
  try {
    const params = new URLSearchParams({ categorie: slug })
    if (commune) params.set('commune', commune)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/annonces/stats?${params}`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return { nb_annonces: 0 }
    return res.json()
  } catch {
    return { nb_annonces: 0 }
  }
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES_SEO).map(slug => ({ categorie: slug }))
}

export async function generateMetadata(
  { params, searchParams }: { params: { categorie: string }; searchParams: { commune?: string } }
): Promise<Metadata> {
  const cat = CATEGORIES_SEO[params.categorie]
  if (!cat) return { title: 'Catégorie introuvable | Troca' }

  const stats = await getCategoryStats(params.categorie, searchParams.commune)
  return generateCategoryMetadata(params.categorie, stats.nb_annonces, searchParams.commune)
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { categorie: string }
  searchParams: { commune?: string; q?: string; page?: string }
}) {
  const cat = CATEGORIES_SEO[params.categorie]
  if (!cat) notFound()

  const stats = await getCategoryStats(params.categorie, searchParams.commune)

  const breadcrumbs = [
    { name: 'Accueil',    url: SITE_URL },
    { name: 'Annonces',   url: `${SITE_URL}/annonces` },
    { name: cat.label,    url: `${SITE_URL}/annonces/categorie/${params.categorie}` },
  ]

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema(breadcrumbs)} />

      {/* Fil d'Ariane */}
      <nav aria-label="Fil d'Ariane" className="text-xs text-night/40 flex items-center gap-1 px-4 py-2">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.url} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>›</span>}
            {i < breadcrumbs.length - 1
              ? <a href={crumb.url} className="hover:text-coral transition-colors">{crumb.name}</a>
              : <span className="text-night/70 font-medium">{crumb.name}</span>
            }
          </span>
        ))}
      </nav>

      {/* En-tête catégorie SEO-friendly (H1 visible par Google) */}
      <div className="px-4 py-6 border-b border-night/8">
        <h1 className="text-2xl font-display font-bold text-night flex items-center gap-2">
          <span aria-hidden>{cat.emoji}</span>
          {cat.label}
          {searchParams.commune && <span className="text-night/50"> à {searchParams.commune}</span>}
        </h1>
        <p className="text-sm text-night/50 mt-1">
          {stats.nb_annonces.toLocaleString('fr-FR')} annonce{stats.nb_annonces > 1 ? 's' : ''} disponible{stats.nb_annonces > 1 ? 's' : ''}
        </p>
        {/* Description catégorie indexée par Google */}
        <p className="text-xs text-night/40 mt-2 max-w-xl">
          {cat.description}
        </p>
      </div>

      {/*
        Ton composant de liste d'annonces existant ici :
        <AnnoncesList categorie={params.categorie} filters={searchParams} />
      */}
    </>
  )
}
