'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Eye,
  Heart,
  ListChecks,
  MailCheck,
  MapPin,
  MessageCircle,
  Package,
  PhoneCall,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import PlanBadge from '@/components/PlanBadge'
import AccountTabs from '@/components/layout/AccountTabs'
import ListingCard from '@/components/listings/ListingCard'
import type { AccountOverviewData, AccountSubscriptionState } from '@/types/account'

const ACCOUNT_TABS = [
  { id: 'overview', label: 'Vue d’ensemble', href: '/profil', icon: <CircleUserRound className="h-4 w-4" /> },
  { id: 'listings', label: 'Mes annonces', href: '/profil/annonces', icon: <Package className="h-4 w-4" /> },
  { id: 'favorites', label: 'Coups de cœur', href: '/favoris', icon: <Heart className="h-4 w-4" /> },
  { id: 'messages', label: 'Messages', href: '/messages', icon: <MessageCircle className="h-4 w-4" /> },
  { id: 'appointments', label: 'Rendez-vous', href: '/mes-rdv', icon: <CalendarDays className="h-4 w-4" /> },
]

function relativeDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const delta = Math.round((date.getTime() - Date.now()) / 86_400_000)
  if (delta === 0) return 'Aujourd’hui'
  if (delta === -1) return 'Hier'
  if (delta === 1) return 'Demain'
  if (delta > 1 && delta < 7) return `Dans ${delta} jours`
  if (delta < -1 && delta > -7) return `Il y a ${Math.abs(delta)} jours`
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
}

function appointmentStatus(status: string) {
  const value = status.toLocaleLowerCase('fr-FR')
  if (['confirmed', 'accepted', 'auto_confirmed'].includes(value)) return 'Confirmé'
  if (value === 'pending') return 'En attente'
  return 'À venir'
}

function getAccountAlert(data: AccountOverviewData) {
  const status = data.subscription.status
  if (data.subscription.plan === 'pro' && ['payment_failed', 'expired'].includes(status)) {
    return {
      icon: AlertTriangle,
      title: status === 'payment_failed' ? 'Votre paiement a échoué' : 'Votre abonnement a expiré',
      body: status === 'payment_failed'
        ? 'Mettez à jour votre moyen de paiement pour conserver vos avantages Pro.'
        : 'Réactivez votre abonnement pour retrouver vos avantages Pro.',
      href: status === 'payment_failed' ? '/parametres#factures' : '/abonnement',
      label: status === 'payment_failed' ? 'Mettre à jour le paiement' : 'Réactiver mon abonnement',
      className: 'border-[var(--color-error)] bg-[var(--color-error-soft)] text-[var(--color-error)]',
    }
  }
  if (data.subscription.plan === 'pro' && status === 'expiring_soon') {
    const days = data.subscription.daysRemaining
    return {
      icon: Clock3,
      title: days == null ? 'Votre abonnement arrive à échéance' : `Votre abonnement expire dans ${days} jour${days > 1 ? 's' : ''}`,
      body: 'Renouvelez-le pour garder vos annonces et vos avantages actifs sans interruption.',
      href: '/abonnement',
      label: 'Renouveler maintenant',
      className: 'border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-accent-text',
    }
  }
  if (data.completion.percentage < 100) {
    return {
      icon: Sparkles,
      title: `Votre profil est complété à ${data.completion.percentage} %`,
      body: `Ajoutez ${data.completion.missingLabels.join(', ')} pour inspirer davantage confiance.`,
      href: '/parametres',
      label: 'Compléter mon profil',
      className: 'border-info-border bg-info-soft text-info-text',
    }
  }
  return null
}

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-eyebrow font-semibold uppercase tracking-[0.18em] text-accent-text">{eyebrow}</p>
        <h2 className="mt-1 font-display text-2xl font-normal text-ink">{title}</h2>
      </div>
      {href && linkLabel ? (
        <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-[15px] font-semibold text-info-text hover:underline">
          {linkLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  )
}

function EmptyBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-warm-border bg-cream-sunken p-6 text-center text-[15px] text-ink/65">
      {children}
    </div>
  )
}

export function AccountOverviewSkeleton() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8" role="status" aria-label="Chargement de votre compte">
      <div className="skeleton h-48 rounded-block" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton h-28 rounded-card" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="skeleton h-96 rounded-block" />
        <div className="skeleton h-96 rounded-block" />
      </div>
    </div>
  )
}

export default function AccountOverview({
  data,
  demo,
  demoSubscription,
}: {
  data: AccountOverviewData
  demo: boolean
  demoSubscription: AccountSubscriptionState
}) {
  const alert = getAccountAlert(data)
  const profile = data.profile
  const accountLabel = profile.accountKind === 'particulier' ? 'Compte particulier' : profile.accountKind === 'pro' ? 'Compte professionnel' : 'Compte bon plan'
  const metrics = [
    { label: 'Annonces actives', value: data.metrics.activeListings, icon: Package },
    { label: 'Vues cumulées', value: data.metrics.totalViews, icon: Eye },
    { label: 'Messages non lus', value: data.metrics.unreadMessages, icon: MessageCircle },
    { label: 'Rendez-vous à venir', value: data.metrics.upcomingAppointments, icon: CalendarDays },
  ]

  return (
    <main className="bg-cream text-ink">
      <section className="border-b border-warm-border bg-cream-surface">
        <div className="mx-auto max-w-7xl px-4 pt-8">
          <div className="flex flex-col gap-6 pb-7 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-cream-surface bg-info-soft text-xl font-semibold text-info-text shadow-card">
                {profile.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt="" fill sizes="80px" className="object-cover" />
                ) : profile.initials}
              </div>
              <div className="min-w-0">
                <p className="text-eyebrow font-semibold uppercase tracking-[0.18em] text-accent-text">{accountLabel}</p>
                <h1 className="mt-1 truncate font-display text-3xl font-normal text-ink sm:text-4xl">Bonjour {profile.firstName || profile.displayName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[15px] text-ink/65">
                  {profile.communeName ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.communeName}</span> : null}
                  {profile.rating != null ? <span className="inline-flex items-center gap-1"><BadgeCheck className="h-4 w-4 text-accent-text" />{profile.rating.toFixed(1)} ({profile.reviewsCount})</span> : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <PlanBadge plan={data.subscription.plan} status={data.subscription.status} />
              <Link href="/parametres" className="inline-flex min-h-11 items-center gap-2 rounded-control border border-warm-border bg-cream-surface px-4 text-[15px] font-semibold text-ink hover:border-ink/30">
                <Settings className="h-4 w-4" />
                Modifier mon profil
              </Link>
            </div>
          </div>
          <AccountTabs items={ACCOUNT_TABS} activeId="overview" />
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-7 sm:py-9">
        {demo ? (
          <section className="rounded-card border border-info-border bg-info-soft p-4" aria-label="Variantes de démonstration">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-info-text">Aperçu de l’abonnement</p>
                <p className="mt-1 text-[15px] text-ink/65">Ce contrôle est visible uniquement avec les données de démonstration.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  ['active', 'Actif'],
                  ['expiring_soon', 'Expire bientôt'],
                  ['payment_failed', 'Paiement échoué'],
                ] as const).map(([state, label]) => (
                  <Link
                    key={state}
                    href={`/profil?demoSubscription=${state}`}
                    aria-current={demoSubscription === state ? 'true' : undefined}
                    className={`inline-flex min-h-11 items-center rounded-control border px-3 text-[15px] font-semibold ${
                      demoSubscription === state
                        ? 'border-accent-strong bg-accent-strong text-cream'
                        : 'border-warm-border bg-cream-surface text-ink hover:border-ink/30'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {alert ? (
          <section className={`rounded-card border p-5 ${alert.className}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <alert.icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <h2 className="text-lg font-semibold">{alert.title}</h2>
                  <p className="mt-1 text-[15px] text-ink/70">{alert.body}</p>
                </div>
              </div>
              <Link href={alert.href} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-control bg-accent-strong px-4 text-[15px] font-semibold text-cream hover:bg-accent-strongHover">
                {alert.label}
              </Link>
            </div>
          </section>
        ) : null}

        {data.partialFailures.length ? (
          <section className="rounded-card border border-info-border bg-info-soft p-4 text-[15px] text-info-text">
            Certaines informations sont momentanément indisponibles : {data.partialFailures.join(', ')}.
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Indicateurs du compte">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-card border border-warm-border bg-cream-surface p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[15px] font-medium text-ink/65">{metric.label}</p>
                <span className="flex h-10 w-10 items-center justify-center rounded-control bg-info-soft text-info-text"><metric.icon className="h-5 w-5" /></span>
              </div>
              <p className="mt-4 font-display text-3xl font-normal text-ink">{metric.value.toLocaleString('fr-FR')}</p>
            </article>
          ))}
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-8">
            <section className="flex flex-col gap-4">
              <SectionHeading eyebrow="Vos publications" title="Dernières annonces" href="/profil/annonces" linkLabel="Voir toutes mes annonces" />
              {data.listings.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {data.listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
                </div>
              ) : (
                <EmptyBlock>
                  <Package className="mx-auto mb-3 h-6 w-6 text-info-text" />
                  Vous n’avez encore aucune annonce active.
                  <Link href="/deposer" className="mt-3 flex min-h-11 items-center justify-center font-semibold text-info-text hover:underline">Déposer une annonce</Link>
                </EmptyBlock>
              )}
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <section className="flex flex-col gap-4 rounded-block border border-warm-border bg-cream-surface p-5 shadow-card">
                <SectionHeading eyebrow="Échanges" title="Conversations récentes" href="/messages" linkLabel="Tout voir" />
                {data.conversations.length ? (
                  <div className="divide-y divide-warm-border">
                    {data.conversations.map((conversation) => (
                      <Link key={conversation.id} href={`/messages?conversation=${conversation.id}`} className="flex min-h-20 items-center gap-3 py-3 hover:text-info-text">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-info-soft text-sm font-semibold text-info-text">
                          {conversation.personName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('fr-FR')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate font-semibold text-ink">{conversation.personName}</span>
                            <span className="shrink-0 text-caption text-ink/50">{relativeDate(conversation.updatedAt)}</span>
                          </span>
                          <span className="mt-1 block truncate text-[15px] text-ink/60">{conversation.preview}</span>
                          <span className="mt-1 block truncate text-caption text-ink/45">{conversation.listingTitle}</span>
                        </span>
                        {conversation.unreadCount ? <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1 text-caption font-semibold text-ink-deep">{conversation.unreadCount}</span> : null}
                      </Link>
                    ))}
                  </div>
                ) : <EmptyBlock>Aucune conversation récente.</EmptyBlock>}
              </section>

              <section className="flex flex-col gap-4 rounded-block border border-warm-border bg-cream-surface p-5 shadow-card">
                <SectionHeading eyebrow="Agenda" title="Prochains rendez-vous" href="/mes-rdv" linkLabel="Tout voir" />
                {data.appointments.length ? (
                  <div className="divide-y divide-warm-border">
                    {data.appointments.map((appointment) => (
                      <Link key={appointment.id} href="/mes-rdv" className="flex min-h-20 items-center gap-3 py-3 hover:text-info-text">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent-text"><CalendarDays className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-ink">{appointment.partnerName}</span>
                          <span className="mt-1 block truncate text-[15px] text-ink/60">{appointment.subject}</span>
                          <span className="mt-1 block text-caption font-semibold text-accent-text">{relativeDate(appointment.startsAt)} · {appointmentStatus(appointment.status)}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : <EmptyBlock>Aucun rendez-vous à venir.</EmptyBlock>}
              </section>
            </div>

            <section className="rounded-block bg-ink-deep p-6 text-cream shadow-card">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 text-[var(--color-success-on-deep)]"><ShieldCheck className="h-5 w-5" /><span className="text-eyebrow font-semibold uppercase tracking-[0.18em]">Sécurité du compte</span></div>
                  <h2 className="mt-3 font-display text-2xl font-normal">Vos moyens de vérification</h2>
                  <p className="mt-2 text-[15px] text-[var(--color-on-deep-muted)]">Ces statuts proviennent directement de votre compte Kalico.</p>
                </div>
                <Link href="/parametres" className="inline-flex min-h-11 items-center justify-center rounded-control border border-[var(--color-on-deep-border)] px-4 text-[15px] font-semibold text-cream hover:bg-cream/10">Gérer la sécurité</Link>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-card border border-[var(--color-on-deep-border)] p-4">
                  <MailCheck className="h-5 w-5 text-[var(--color-success-on-deep)]" />
                  <div><p className="font-semibold">Adresse email</p><p className="mt-1 text-[15px] text-[var(--color-on-deep-muted)]">{profile.emailVerified ? 'Vérifiée' : 'À vérifier'}</p></div>
                </div>
                <div className="flex items-center gap-3 rounded-card border border-[var(--color-on-deep-border)] p-4">
                  <PhoneCall className="h-5 w-5 text-[var(--color-success-on-deep)]" />
                  <div><p className="font-semibold">Numéro de téléphone</p><p className="mt-1 text-[15px] text-[var(--color-on-deep-muted)]">{profile.phoneVerified ? 'Vérifié' : 'À vérifier'}</p></div>
                </div>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
            <section className="rounded-block border border-warm-border bg-cream-surface p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-normal">Profil complété</h2>
                <span className="font-semibold text-accent-text">{data.completion.percentage} %</span>
              </div>
              <div className="mt-4 grid h-2 grid-cols-10 gap-0.5 overflow-hidden rounded-full" role="progressbar" aria-valuenow={data.completion.percentage} aria-valuemin={0} aria-valuemax={100}>
                {Array.from({ length: 10 }).map((_, index) => (
                  <span
                    key={index}
                    aria-hidden="true"
                    className={index < Math.ceil(data.completion.percentage / 10) ? 'bg-accent-strong' : 'bg-cream-sunken'}
                  />
                ))}
              </div>
              {data.completion.missingLabels.length ? <p className="mt-3 text-[15px] leading-relaxed text-ink/60">À ajouter : {data.completion.missingLabels.join(', ')}.</p> : <p className="mt-3 inline-flex items-center gap-2 text-[15px] text-success-text"><CheckCircle2 className="h-4 w-4" />Votre profil est complet.</p>}
              <Link href="/parametres" className="mt-4 flex min-h-11 items-center justify-center rounded-control border border-warm-border px-4 text-[15px] font-semibold text-ink hover:border-ink/30">Mettre à jour</Link>
            </section>

            <section className="rounded-block border border-warm-border bg-cream-surface p-5 shadow-card">
              <h2 className="font-display text-xl font-normal">Votre activité</h2>
              {data.activity.length ? (
                <div className="mt-3 divide-y divide-warm-border">
                  {data.activity.map((item) => (
                    <Link key={item.id} href={item.href} className="flex min-h-16 gap-3 py-3 hover:text-info-text">
                      <Bell className={`mt-1 h-4 w-4 shrink-0 ${item.read ? 'text-ink/35' : 'text-accent-text'}`} />
                      <span className="min-w-0"><span className="block text-[15px] font-semibold text-ink">{item.title}</span><span className="mt-1 block line-clamp-2 text-sm text-ink/55">{item.body}</span><span className="mt-1 block text-caption text-ink/45">{relativeDate(item.createdAt)}</span></span>
                    </Link>
                  ))}
                </div>
              ) : <p className="mt-3 text-[15px] text-ink/60">Aucune activité récente.</p>}
            </section>

            <section className="rounded-block border border-warm-border bg-cream-surface p-5 shadow-card">
              <h2 className="font-display text-xl font-normal">Accès rapides</h2>
              <nav className="mt-3 flex flex-col" aria-label="Accès rapides du compte">
                {[
                  { href: '/deposer', label: 'Déposer une annonce', icon: Package },
                  { href: '/alertes', label: 'Gérer mes alertes', icon: ListChecks },
                  { href: '/messages', label: 'Ouvrir mes messages', icon: MessageCircle },
                  { href: '/parametres/notifications', label: 'Régler mes notifications', icon: Bell },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="flex min-h-11 items-center gap-3 border-b border-warm-border py-2 text-[15px] font-medium text-ink last:border-b-0 hover:text-info-text">
                    <item.icon className="h-4 w-4 text-info-text" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ))}
              </nav>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
