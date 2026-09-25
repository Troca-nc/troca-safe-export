'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback } from 'react'
import { Mail, Shield, FileText, Lock, MessageCircle } from 'lucide-react'

import NewsletterForm from '@/components/layout/NewsletterForm'

const links = [
  { href: '/mentions-legales', label: 'Mentions légales', icon: FileText },
  { href: '/politique-de-confidentialite', label: 'Confidentialité', icon: Lock },
  { href: '/cgu', label: 'CGU', icon: FileText },
  { href: '/cgv', label: 'CGV', icon: Shield },
  { href: '/politique-cookies', label: 'Cookies', icon: Lock },
  { href: '/contact', label: 'Contact', icon: MessageCircle },
]

export default function Footer() {
  const openCookieBanner = useCallback(() => {
    window.dispatchEvent(new Event('kalico-cookie-banner-open'))
  }, [])

  return (
    <footer className="on-deep motif-tressage relative isolate overflow-hidden bg-[var(--color-deep)]">
      <div className="relative z-10 mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="relative h-12 w-12 overflow-hidden rounded-full border border-[var(--color-on-deep-border)] bg-[var(--color-on-deep-surface)]">
                <Image
                  src="/brand/kalico1.svg"
                  alt="Kalico"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              <div>
                <span className="block font-display text-[28px] font-normal leading-none text-[var(--color-on-deep)]">Kalico</span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-on-deep-muted)]">
                  Nouvelle-Calédonie
                </span>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-on-deep-muted)]">
              Petites annonces en Nouvelle-Calédonie. Achetez, vendez, échangez et contactez des vendeurs locaux depuis le web ou le mobile.
            </p>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold text-[var(--color-on-deep)]">Informations</p>
            <div className="grid gap-2">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-2 text-sm text-[var(--color-on-deep-muted)] transition-colors hover:text-[var(--color-accent-soft)]"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <button
                type="button"
                onClick={openCookieBanner}
                className="inline-flex items-center gap-2 text-left text-sm text-[var(--color-on-deep-muted)] transition-colors hover:text-[var(--color-accent-soft)]"
              >
                <Lock className="h-4 w-4" />
                Gérer mes cookies
              </button>
              <a
                href="mailto:contact@kalico.nc"
                className="inline-flex items-center gap-2 text-sm text-[var(--color-on-deep-muted)] transition-colors hover:text-[var(--color-accent-soft)]"
              >
                <Mail className="h-4 w-4" />
                contact@kalico.nc
              </a>
            </div>
          </div>
        </div>

        <section className="mt-10 rounded-[var(--radius-card)] border border-[var(--color-on-deep-border)] bg-[var(--color-on-deep-surface)] p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-soft)]">Newsletter</p>
              <h2 className="mt-1 font-display text-2xl font-normal text-[var(--color-on-deep)]">Recevez notre newsletter</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-on-deep-muted)]">
                Les meilleures annonces, bons plans et pros locaux directement dans votre boîte mail.
              </p>
            </div>

            <div>
              <NewsletterForm />
              <p className="mt-2 text-xs text-[var(--color-on-deep-muted)]">
                Pas de spam. Désinscription en un clic.
              </p>
            </div>
          </div>
        </section>
        <div className="mt-10 flex flex-col gap-2 border-t border-[var(--color-on-deep-border)] pt-5 text-xs text-[var(--color-on-deep-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Kalico - Nouvelle-Calédonie dans l'âme, Kalico dans la poche.</p>
          <p>Nouvelle-Calédonie.</p>
        </div>
      </div>
    </footer>
  )
}
