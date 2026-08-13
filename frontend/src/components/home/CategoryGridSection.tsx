'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { FALLBACK_CATEGORIES, type CategoryNode } from '@/lib/categoryCatalog'
import { getCategoryIcon } from '@/lib/categoryPresentation'

const PRIMARY_CATEGORY_ITEMS = [
  { slug: 'vehicules', label: 'Véhicules' },
  { slug: 'immobilier', label: 'Immobilier' },
  { slug: 'electronique-multimedia', label: 'Électronique' },
  { slug: 'mode', label: 'Mode' },
  { slug: 'maison-jardin', label: 'Maison' },
  { slug: 'emploi', label: 'Emploi' },
  { slug: 'services', label: 'Services' },
  { slug: 'animaux', label: 'Animaux' },
] as const

function findCategoryBySlug(nodes: CategoryNode[], slug: string): CategoryNode | null {
  for (const node of nodes || []) {
    if (node.slug === slug) return node
    const children = node.children || node.subcategories || []
    const found = findCategoryBySlug(children, slug)
    if (found) return found
  }
  return null
}

export default function CategoryGridSection() {
  // TODO: trier par vues réelles quand la métrique existe
  const sortedCategoryItems = [...PRIMARY_CATEGORY_ITEMS].sort((a, b) => a.label.localeCompare(b.label, 'fr'))

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Catégories les plus vues</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Accédez vite aux rayons les plus utiles</h2>
        </div>
        <Link href="/annonces" className="hidden items-center gap-1 text-sm font-semibold text-nc-lagon hover:underline md:inline-flex">
          Voir toutes les annonces <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Catégories les plus vues">
        {sortedCategoryItems.map(({ slug, label }) => {
          const category = findCategoryBySlug(FALLBACK_CATEGORIES, slug)
          const Icon = getCategoryIcon(slug, label, category?.icon)

          return (
            <Link
              key={slug}
              href={`/annonces?categorie=${slug}`}
              role="tab"
              className="group inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] shadow-card transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-nc-lagon">
                <Icon className="h-3.5 w-3.5" />
              </span>
              {label}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
