import Link from 'next/link'
import type { ReactNode } from 'react'

const navLinks = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/politique-de-confidentialite', label: 'Confidentialité' },
  { href: '/cgu', label: 'CGU' },
  { href: '/cgv', label: 'CGV' },
  { href: '/politique-cookies', label: 'Cookies' },
]

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  children: ReactNode
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-ink">
      <div className="mb-8">
        <p className="inline-flex items-center gap-2 text-eyebrow-sm uppercase text-accent-text">
          {title}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-body-sm text-ink/55">Dernière mise à jour : {lastUpdated}</p>
      </div>

      <nav className="mb-8 flex flex-wrap gap-3 text-body-sm">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex min-h-11 items-center rounded-pill border border-warm-border bg-cream-surface px-3 py-2 text-ink/70 transition hover:border-accent-text/35 hover:text-accent-text"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="legal-content prose max-w-none text-ink">
        {children}
      </div>

      <div className="mt-12 rounded-card border border-warm-border bg-cream-surface p-4 text-body-sm text-ink/70 shadow-card">
        <p>
          Pour toute question juridique : <a href="mailto:legal@kalico.nc">legal@kalico.nc</a>
        </p>
        <p className="mt-2">
          Pour exercer vos droits RGPD : <a href="mailto:privacy@kalico.nc">privacy@kalico.nc</a>
        </p>
      </div>
    </main>
  )
}
