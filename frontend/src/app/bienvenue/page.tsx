'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, BadgeCheck, Megaphone, Store, UserRound, Sparkles, CheckCircle2 } from 'lucide-react'
import { PRO_PLANS } from '@/types/monetisation.types'

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
    title: 'Bienvenue chez Kalico',
    subtitle: 'Votre compte particulier est pr�t. Vous pouvez d�j� publier, chercher et discuter.',
    icon: UserRound,
    cta: { label: 'Déposer ma premi�re annonce', href: '/annonces/nouvelle' },
    items: ['Compl�ter votre profil', 'Ajouter une photo', 'Publier votre annonce'],
    badge: 'Compte particulier cr��',
  },
  pro: {
    title: 'Bienvenue dans lespace professionnel',
    subtitle: 'Votre compte pro est pr�t. Vous pouvez maintenant pr�parer votre vitrine et vos options de visibilit�.',
    icon: Store,
    cta: { label: 'Choisir ma formule Pro', href: '/abonnement' },
    items: ['Comparer les prix', 'Choisir mensuel ou annuel', 'Activer les boosts moins chers'],
    badge: 'Compte pro pr�t � configurer',
  },
}

const PRO_PLAN = PRO_PLANS[0]

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
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">�tape suivante</p>
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
              <p className="text-sm font-semibold text-night">Vos premi�res actions</p>
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
                  {role === 'pro' ? 'Le mode pro se d�bloque �tape par �tape' : 'Le parcours particulier est simple et rapide'}
                </p>
              </div>
              <p className="mt-3 text-sm text-night/60">
                Vous pouvez maintenant continuer vers votre espace personnel ou publier votre premi�re annonce.
              </p>
              {role === 'pro' && (
                <div className="mt-4 rounded-2xl bg-coral/5 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-coral" />
                    <p className="text-sm font-semibold text-night">Compte pro en cours de configuration</p>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-night/65">
                    {['Compl�ter les infos soci�t�', 'Choisir un plan pro', 'Activer la visibilit�'].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-jungle" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-night/55">
                    La cr�ation reste gratuite. Les options pro sactivent ensuite selon le plan choisi dans lespace vendeur. Vous pourrez ensuite ajouter vos annonces, vos boosts et vos campagnes.
                  </p>
                </div>
              )}
            </div>
          </div>

          {role === 'pro' ? (
            <div className="mt-6 rounded-[2rem] border border-coral/15 bg-gradient-to-br from-coral/10 via-white to-white p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Choisir la formule</p>
                  <h2 className="mt-1 text-2xl font-bold text-night">Le prix devient l�l�ment principal</h2>
                  <p className="mt-2 text-sm text-night/60">
                    La cr�ation reste gratuite. Ensuite, vous choisissez votre rythme Pro selon le besoin r�el de votre activit�.
                  </p>
                </div>
                <span className="rounded-full bg-night px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                  � partir de {PRO_PLAN.price_monthly.toLocaleString('fr-FR')} XPF / mois
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.75rem] border border-night/10 bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-night/45">Mensuel</p>
                  <p className="mt-2 text-3xl font-bold text-night">{PRO_PLAN.price_monthly.toLocaleString('fr-FR')} XPF</p>
                  <p className="mt-1 text-sm text-night/55">Id�al pour tester et garder de la souplesse.</p>
                </div>
                <div className="rounded-[1.75rem] border border-coral/25 bg-coral/5 p-5 shadow-[0_16px_40px_rgba(231,111,81,0.10)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral/80">Annuel</p>
                    <span className="rounded-full bg-coral px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">Recommand�</span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-night">{PRO_PLAN.price_yearly.toLocaleString('fr-FR')} XPF</p>
                  <p className="mt-1 text-sm text-night/55">Plus lisible pour un usage pro r�gulier.</p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={config.cta.href} className="btn-primary justify-center px-5 py-3">
              {config.cta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/profil" className="btn-ghost justify-center px-5 py-3">
              Aller � mon compte
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
