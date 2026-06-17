import Image from 'next/image'
import Link from 'next/link'
import { SearchX } from 'lucide-react'

import Header from '@/components/layout/Header'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center px-4 py-16">
        <section className="w-full rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-sm md:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-white shadow-sm">
            <Image src="/brand/kalico-logo.png" alt="Kalico" width={80} height={80} className="h-full w-full object-cover" priority />
          </div>
          <SearchX className="mx-auto mt-5 h-14 w-14 text-[#0A7EA4]" />
          <h1 className="mt-4 font-display text-3xl font-bold">Cette page n'existe pas</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-night/60">
            La page que vous cherchez a peut-être été déplacée ou supprimée.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="btn-primary inline-flex items-center justify-center rounded-2xl px-5 py-3">
              Retour à l'accueil
            </Link>
            <Link href="/annonces" className="btn-secondary inline-flex items-center justify-center rounded-2xl px-5 py-3">
              Voir les annonces
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] px-5 py-3 font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
              Contacter le support
            </Link>
          </div>

          <form action="/annonces" className="mx-auto mt-8 flex max-w-xl gap-3">
            <input
              name="q"
              placeholder="Rechercher une annonce..."
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none"
            />
            <button type="submit" className="btn-primary rounded-2xl px-4 py-3">
              Rechercher
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
