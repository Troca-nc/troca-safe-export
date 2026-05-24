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
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-coral font-semibold">
          {title}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-night">{title}</h1>
        <p className="mt-2 text-sm text-night/45">Dernière mise à jour : {lastUpdated}</p>
      </div>

      <nav className="mb-8 flex flex-wrap gap-3 text-sm">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-night/10 bg-white px-3 py-1.5 text-night/65 transition hover:border-coral/30 hover:text-coral"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="legal-content prose prose-slate dark:prose-invert max-w-none">
        {children}
      </div>

      <div className="mt-12 rounded-2xl border border-night/10 bg-white/80 p-4 text-sm text-night/70 shadow-sm">
        <p>
          Pour toute question juridique : <a href="mailto:legal@troca.nc">legal@troca.nc</a>
        </p>
        <p className="mt-2">
          Pour exercer vos droits RGPD : <a href="mailto:privacy@troca.nc">privacy@troca.nc</a>
        </p>
      </div>
    </main>
  )
}
