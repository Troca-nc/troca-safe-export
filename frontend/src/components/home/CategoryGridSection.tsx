'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const CATEGORY_ITEMS = [
  { initial: 'V', label: 'Véhicules', hint: 'voitures, 4×4, bateaux', href: '/annonces?categorie=vehicules' },
  { initial: 'I', label: 'Immobilier', hint: 'location, vente, terrains', href: '/annonces?categorie=immobilier' },
  { initial: 'M', label: 'Maison', hint: 'meubles, jardin, bricolage', href: '/annonces?categorie=maison-jardin' },
  { initial: 'É', label: 'Électronique', hint: 'téléphones, informatique', href: '/annonces?categorie=electronique-multimedia' },
  { initial: 'S', label: 'Services', hint: 'artisans, cours, ménage', href: '/annonces?categorie=services' },
  { initial: 'E', label: 'Emploi', hint: 'offres et demandes', href: '/annonces?categorie=emploi' },
  { initial: 'L', label: 'Loisirs', hint: 'surf, plongée, pêche', href: '/annonces?categorie=loisirs' },
  { initial: 'A', label: 'Animaux', hint: 'adoption, accessoires', href: '/annonces?categorie=animaux' },
] as const

export default function CategoryGridSection() {
  return (
    <section className="mx-auto max-w-[1440px] bg-[var(--color-bg)] px-4 pt-[72px] sm:px-6 lg:px-12">
      <div className="flex items-end justify-between gap-8 mb-7">
        <div>
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-text)]">
            Catégories
          </p>
          <h2 className="mt-3 mb-0 font-display font-normal text-[46px] leading-[1.05]">
            Par où vous commencez
          </h2>
        </div>
        <Link
          href="/annonces"
          className="inline-flex items-center gap-[6px] text-[15px] font-semibold text-[var(--color-text-primary)] pb-[6px]"
        >
          Toutes les catégories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORY_ITEMS.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[20px_22px] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--color-border-strong)]"
          >
            <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[12px] bg-[var(--color-accent-soft)] font-display text-[24px] text-[var(--color-accent-text)]">
              {cat.initial}
            </span>
            <span className="min-w-0">
              <span className="block text-[16px] font-semibold text-[var(--color-text-primary)]">
                {cat.label}
              </span>
              <span className="block mt-[2px] text-[13px] text-[var(--color-text-muted)]">
                {cat.hint}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
