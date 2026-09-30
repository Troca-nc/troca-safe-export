'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const FOOTER_COLUMNS = [
  {
    title: 'Acheter & vendre',
    links: [
      { href: '/annonces', label: 'Annonces' },
      { href: '/troc', label: 'Troc' },
      { href: '/annonces?type=don', label: 'Dons' },
      { href: '/annonces?category=immobilier', label: 'Immobilier' },
      { href: '/annonces?category=vehicules', label: 'Véhicules' },
    ],
  },
  {
    title: 'Services',
    links: [
      { href: '/pros', label: 'Annuaire des pros' },
      { href: '/pro', label: 'Devenir Pro' },
      { href: '/appels-offres', label: "Appels d'offres" },
      { href: '/covoiturage', label: 'Covoiturage' },
      { href: '/envoi-livraison', label: 'Envoi & livraison' },
    ],
  },
  {
    title: 'Kalico',
    links: [
      { href: '/cgu', label: 'Sécurité' },
      { href: '/contact', label: 'Contact' },
      { href: '/cgu', label: 'CGU' },
      { href: '/politique-de-confidentialite', label: 'Confidentialité' },
    ],
  },
] as const

export default function FooterV2() {
  const pathname = usePathname()
  const short = pathname.startsWith('/troc')
  const openCookieBanner = useCallback(() => {
    window.dispatchEvent(new Event('kalico-cookie-banner-open'))
  }, [])

  if (short) {
    return (
      <footer className="on-deep motif-tressage relative isolate mt-20 overflow-hidden bg-ink-deep">
        <div className="relative z-10 mx-auto flex max-w-container flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-12">
          <div className="flex items-center gap-3">
            <Image src="/brand/kalico1.svg" alt="Kalico" width={120} height={40} className="h-10 w-auto" />
            <p className="font-display text-[22px] italic text-cream/85">Nouvelle-Calédonie dans l&apos;âme, Kalico dans la poche.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-meta" aria-label="Liens de pied de page">
            <Link href="/cgu" className="min-h-11 py-3 text-cream/75 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Troquer en sécurité</Link>
            <Link href="/cgu" className="min-h-11 py-3 text-cream/75 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">CGU</Link>
            <a href="mailto:contact@kalico.nc" className="min-h-11 py-3 text-cream/75 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">contact@kalico.nc</a>
          </nav>
        </div>
      </footer>
    )
  }

  return (
    <footer className="on-deep motif-tressage relative isolate mt-[72px] overflow-hidden bg-ink-deep">
      <div className="relative z-10 mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-12 lg:pb-10 lg:pt-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <Image src="/brand/kalico1.svg" alt="Kalico" width={144} height={48} className="h-12 w-auto" />
              <span className="font-display text-[30px] leading-none text-cream">Kalico</span>
            </div>
            <p className="mt-5 max-w-sm font-display text-2xl italic leading-tight text-cream/85">Nouvelle-Calédonie dans l&apos;âme, Kalico dans la poche.</p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-eyebrow uppercase text-cream/45">{column.title}</p>
              <div className="mt-3 flex flex-col gap-0.5">
                {column.links.map((link) => (
                  <Link key={`${column.title}-${link.label}`} href={link.href} className="min-h-11 py-2.5 text-[15px] text-cream/80 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                    {link.label}
                  </Link>
                ))}
                {column.title === 'Kalico' ? (
                  <button type="button" onClick={openCookieBanner} className="min-h-11 py-2.5 text-left text-[15px] text-cream/80 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                    Cookies
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-cream/15 pt-5 text-meta text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Kalico · Nouvelle-Calédonie</p>
          <a href="mailto:contact@kalico.nc" className="min-h-11 py-3 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">contact@kalico.nc</a>
        </div>
      </div>
    </footer>
  )
}
