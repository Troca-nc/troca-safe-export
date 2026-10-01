'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import type { HomeCategory } from '@/types/home'

export default function CategoryGridSection({ categories }: { categories: HomeCategory[] }) {
  return (
    <section className="mx-auto max-w-container px-4 pt-[72px] sm:px-6 lg:px-12" aria-labelledby="home-categories-title">
      <div className="mb-7 flex items-end justify-between gap-6">
        <div>
          <p className="m-0 text-eyebrow uppercase text-accent-text">Catégories</p>
          <h2 id="home-categories-title" className="mb-0 mt-3 font-display text-h2 font-normal text-ink">
            Par où vous commencez
          </h2>
        </div>
        <Link href="/annonces" className="inline-flex min-h-11 items-center gap-2 text-label text-ink">
          <span className="hidden sm:inline">Toutes les catégories</span>
          <span className="sm:hidden">Tout voir</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/annonces?categorie=${encodeURIComponent(category.slug)}`}
            className="flex min-h-24 items-center gap-4 rounded-card border border-warm-border bg-cream-surface p-5 text-ink shadow-card transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-accent/15 font-display text-price-sm text-accent-text">
              {category.initial}
            </span>
            <span className="min-w-0">
              <span className="block text-label">{category.name}</span>
              <span className="mt-1 block line-clamp-2 text-meta text-ink/60">{category.hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
