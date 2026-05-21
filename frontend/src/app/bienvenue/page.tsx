'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, BadgeCheck, Megaphone, Store, UserRound, Sparkles, CheckCircle2 } from 'lucide-react'

type Role = 'particulier' | 'pro'

const CONFIG: Record<Role, {
  title: string
  subtitle: string
  icon: typeof UserRound
  cta: { label: string; href: string }
  items: string[]
  badge: string
}> = {
  particulier: {
    title: 'Bienvenue chez Troca',
    subtitle: 'Votre compte particulier est prêt. Vous pouvez déjà publier, chercher et discuter.',
    icon: UserRound,
    cta: { label: 'Déposer ma première annonce', href: '/annonces/nouvelle' },
    items: ['Compléter votre profil', 'Ajouter une photo', 'Publier votre annonce'],
    badge: 'Compte particulier créé',
  },
  pro: {
    title: 'Bienvenue dans l’espace professionnel',
    subtitle: 'Votre compte pro est prêt. Vous pouvez maintenant préparer votre vitrine et vos options de visibilité.',
    icon: Store,
    cta: { label: 'Découvrir l’espace pro', href: '/parametres' },
    items: ['Compléter les infos société', 'Choisir un plan pro', 'Mettre en avant vos annonces'],
    badge: 'Compte pro en configuration',
  },
}

function BienvenueContent() {
  const searchParams = useSearchParams()
  const role = (searchParams.get('role') === 'pro' ? 'pro' : 'particulier') as Role
  const config = CONFIG[role]
  const Icon = config.icon

  return (
    <div className="min-h-screen bg-sand-light px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-night/10 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Étape suivante</p>
                <h1 className="mt-1 font-display text-3xl font-bold text-night">{config.title}</h1>
                <p className="mt-2 text-sm text-night/60">{config.subtitle}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-jungle/10 px-3 py-1 text-xs font-semibold text-jungle">
              <BadgeCheck className="h-3.5 w-3.5" />
              {config.badge}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-sand/70 p-4">
              <p className="text-sm font-semibold text-night">Vos premières actions</p>
              <ul className="mt-3 space-y-2 text-sm text-night/65">
                {config.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-jungle" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-night/10 bg-white p-4">
              <div className="flex items-center gap-3">
                {role === 'pro' ? <Megaphone className="h-5 w-5 text-coral" /> : <ArrowRight className="h-5 w-5 text-coral" />}
                <p className="text-sm font-semibold text-night">
                  {role === 'pro' ? 'Le mode pro se débloque étape par étape' : 'Le parcours particulier est simple et rapide'}
                </p>
              </div>
              <p className="mt-3 text-sm text-night/60">
                Vous pouvez maintenant continuer vers votre espace personnel ou publier votre première annonce.
              </p>
              {role === 'pro' && (
                <div className="mt-4 rounded-2xl bg-coral/5 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-coral" />
                    <p className="text-sm font-semibold text-night">Compte pro en cours de configuration</p>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-night/65">
                    {['Compléter les infos société', 'Choisir un plan pro', 'Activer la visibilité'].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-jungle" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-night/55">
                    La création reste gratuite. Les options pro s’activent ensuite selon le plan choisi dans l’espace vendeur. Vous pourrez ensuite ajouter vos annonces, vos boosts et vos campagnes.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={config.cta.href} className="btn-primary justify-center px-5 py-3">
              {config.cta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/profil" className="btn-ghost justify-center px-5 py-3">
              Aller à mon compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BienvenuePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <BienvenueContent />
    </Suspense>
  )
}
