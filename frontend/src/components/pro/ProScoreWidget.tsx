'use client'

import Link from 'next/link'
import { useMemo, type ComponentType } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  AlertCircle,
  Gauge,
  Megaphone,
  MessageCircle,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react'

type DashboardStats = {
  views_total: number
  views_7d: number
  views_30d: number
  contacts_total: number
  contacts_7d: number
  avg_conversion_rate: number
}

type DashboardListings = {
  total: number
  active: number
  boosted: number
  expired: number
}

type Suggestion = {
  id: string
  title: string
  description: string
  href: string
  cta: string
  icon: ComponentType<{ className?: string }>
  tone: 'lagon' | 'emeraude' | 'corail' | 'amber'
}

function toneForScore(score: number) {
  if (score >= 85) return { label: 'Tres solide', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  if (score >= 70) return { label: 'En bonne voie', className: 'text-[#0A7EA4] bg-nc-lagonLight border-[#0A7EA4]/15' }
  if (score >= 50) return { label: 'A renforcer', className: 'text-amber-700 bg-amber-50 border-amber-200' }
  return { label: 'A construire', className: 'text-kalico-blue bg-kalico-blue/10 border-kalico-blue/20' }
}

function buildSuggestions({
  listings,
  stats,
  unreadMessages,
  unreadClients,
  unreadConversations,
  boostsActiveCount,
}: {
  listings: DashboardListings
  stats: DashboardStats
  unreadMessages: number
  unreadClients: number
  unreadConversations: number
  boostsActiveCount: number
}): Suggestion[] {
  const suggestions: Suggestion[] = []

  if (listings.active === 0) {
    suggestions.push({
      id: 'publish-first-listing',
      title: 'Publiez votre premiere annonce',
      description: 'Un catalogue actif est la base pour recevoir des contacts et faire demarrer votre vitrine.',
      href: '/annonces/nouvelle',
      cta: 'Publier maintenant',
      icon: Megaphone,
      tone: 'corail',
    })
  }

  if (unreadMessages > 0 || unreadConversations > 0) {
    suggestions.push({
      id: 'reply-messages',
      title: 'Repondez aux messages en attente',
      description: `${unreadMessages.toLocaleString('fr-FR')} messages non lus provenant de ${unreadClients.toLocaleString('fr-FR')} clients different${unreadClients > 1 ? 's' : ''}.`,
      href: '/messages',
      cta: 'Ouvrir la messagerie',
      icon: MessageCircle,
      tone: 'lagon',
    })
  }

  if (listings.active > 0 && boostsActiveCount === 0) {
    suggestions.push({
      id: 'boost-listing',
      title: 'Boostez une annonce phare',
      description: 'Un boost court peut donner plus de visibilite a vos annonces les plus importantes.',
      href: '/pro/dashboard/boosts',
      cta: 'Voir les boosts',
      icon: TrendingUp,
      tone: 'amber',
    })
  }

  if (listings.active > 0 && stats.avg_conversion_rate < 2) {
    suggestions.push({
      id: 'improve-conversion',
      title: 'Ameliorez votre conversion',
      description: 'Ajoutez plus de photos, une description plus precise et un prix clair pour rassurer vos visiteurs.',
      href: '/annonces/nouvelle',
      cta: 'Optimiser mes annonces',
      icon: Sparkles,
      tone: 'emeraude',
    })
  }

  if (listings.active > 0 && stats.views_7d > 0 && stats.contacts_7d === 0) {
    suggestions.push({
      id: 'profile-trust',
      title: 'Renforcez la confiance',
      description: 'Votre annonce attire des vues, mais pas encore assez de contacts. Mettez en avant les garanties et les details utiles.',
      href: '/pro/dashboard/parametres',
      cta: 'Soigner ma vitrine',
      icon: BadgeCheck,
      tone: 'lagon',
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: 'keep-going',
      title: 'Continuez sur cette lancee',
      description: 'Vos indicateurs sont stables. Consultez vos statistiques pour garder le cap et reperez les prochaines opportunites.',
      href: '/pro/dashboard#stats',
      cta: 'Voir les stats',
      icon: Gauge,
      tone: 'lagon',
    })
  }

  return suggestions.slice(0, 3)
}

export default function ProScoreWidget({
  listings,
  stats,
  unreadMessages,
  unreadClients,
  unreadConversations,
  boostsActiveCount,
  topListingsCount,
  recentContactsCount,
}: {
  listings: DashboardListings
  stats: DashboardStats
  unreadMessages: number
  unreadClients: number
  unreadConversations: number
  boostsActiveCount: number
  topListingsCount: number
  recentContactsCount: number
}) {
  const score = useMemo(() => {
    let value = 0

    if (listings.active > 0) value += 25
    if (listings.active > 2) value += 10
    if (listings.boosted > 0 || boostsActiveCount > 0) value += 15
    if (stats.views_7d > 0) value += 10
    if (stats.contacts_7d > 0) value += 15
    if (stats.avg_conversion_rate >= 4) value += 15
    else if (stats.avg_conversion_rate >= 2) value += 10
    else if (stats.avg_conversion_rate > 0) value += 5
    if (unreadMessages === 0 && unreadConversations === 0) value += 10
    else if (unreadMessages <= 5) value += 5
    if (topListingsCount > 0) value += 5
    if (recentContactsCount > 0) value += 5

    return Math.max(0, Math.min(100, value))
  }, [
    boostsActiveCount,
    listings.active,
    listings.boosted,
    recentContactsCount,
    stats.avg_conversion_rate,
    stats.contacts_7d,
    stats.views_7d,
    topListingsCount,
    unreadConversations,
    unreadMessages,
  ])

  const label = toneForScore(score)
  const suggestions = useMemo(
    () => buildSuggestions({
      listings,
      stats,
      unreadMessages,
      unreadClients,
      unreadConversations,
      boostsActiveCount,
    }),
    [boostsActiveCount, listings, stats, unreadClients, unreadConversations, unreadMessages]
  )

  return (
    <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-kalico-blue/80">Pilotage</p>
          <h2 className="mt-1 font-display text-xl font-bold text-night sm:text-2xl">Score de performance de votre vitrine</h2>
          <p className="mt-2 text-sm leading-relaxed text-night/60">
            Ce score synthï¿½tique vous indique si votre vitrine avance bien et quelles actions peuvent encore faire progresser vos resultats.
          </p>
        </div>

        <div className={`rounded-3xl border px-4 py-3 self-start ${label.className}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70">
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">Score global</p>
              <p className="text-3xl font-bold">{score}/100</p>
              <p className="text-sm font-medium">{label.label}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-night">Progression visible</p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">{score}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-[#0A7EA4] transition-all duration-300" style={{ width: `${score}%` }} />
        </div>
        <div className="mt-3 grid gap-2 text-xs text-night/55 sm:grid-cols-3">
          <div className="rounded-2xl bg-white px-3 py-2">Annonces actives: {listings.active}</div>
          <div className="rounded-2xl bg-white px-3 py-2">Boosts actifs: {boostsActiveCount}</div>
          <div className="rounded-2xl bg-white px-3 py-2">Contacts 7j: {stats.contacts_7d}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Actions prioritaires</p>
          <span className="text-xs font-medium text-night/45">{suggestions.length} conseil{suggestions.length > 1 ? 's' : ''}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon
            const toneClasses = {
              lagon: 'border-[#0A7EA4]/15 bg-nc-lagonLight text-[#0A7EA4]',
              emeraude: 'border-nc-emeraude/15 bg-nc-emeraudeLight text-nc-emeraude',
              corail: 'border-kalico-blue/15 bg-kalico-blue/10 text-kalico-blue',
              amber: 'border-amber-200 bg-amber-50 text-amber-700',
            } as const

            return (
              <article
                key={suggestion.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[suggestion.tone]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-night">{suggestion.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-night/60">{suggestion.description}</p>
                  </div>
                </div>

                <Link
                  href={suggestion.href}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-surface)] sm:w-auto"
                >
                  {suggestion.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-medium text-night/55 sm:text-xs">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
          Ces recommandations s&apos;appuient sur vos vues, contacts, messages et boosts en cours.
        </div>
      </div>
    </section>
  )
}
