'use client'

import Link from 'next/link'

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
    <section className="bg-[var(--color-bg-page)] p-[72px_48px_0]">
      <div className="flex items-end justify-between gap-8 mb-7">
        <div>
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-lagon)]">
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORY_ITEMS.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="flex items-center gap-4 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] p-[20px_22px] hover:border-[var(--color-lagon-dark)]"
          >
            <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[12px] bg-[rgba(232,131,42,0.14)] font-display text-[24px] text-[var(--color-lagon-dark)]">
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
