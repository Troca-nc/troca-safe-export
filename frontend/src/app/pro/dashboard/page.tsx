'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  MessageCircle,
  Package,
  TrendingUp,
  Zap,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { proApi } from '@/lib/api'
import ProOnboardingGuide from '@/components/pro/ProOnboardingGuide'
import ProScoreWidget from '@/components/pro/ProScoreWidget'
import { useAuthStore } from '@/store/authStore'

type DashboardData = {
  listings: {
    total: number
    active: number
    boosted: number
    expired: number
  }
  stats: {
    views_total: number
    views_7d: number
    views_30d: number
    contacts_total: number
    contacts_7d: number
    avg_conversion_rate: number
  }
  unread_messages_total: number
  unread_clients_total: number
  unread_conversations_total: number
  unread_threads: Array<{
    conversation_id: number
    buyer_id: number
    buyer_prenom: string | null
    buyer_nom: string | null
    buyer_avatar_url: string | null
    listing_id: number
    listing_title: string | null
    unread_count: number
    last_unread_at: string | null
    last_unread_message: string | null
  }>
  top_listings: any[]
  recent_contacts: any[]
  boosts_active: any[]
  spend_total_xpf: number
  spend_30d_xpf: number
  timeline_30d: Array<{ day: string; label: string; views: number; contacts: number }>
}

function KpiCard({
  icon: Icon,
  title,
  value,
  subtitle,
  tone = 'lagon',
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  value: string
  subtitle: string
  tone?: 'lagon' | 'emeraude' | 'corail' | 'amber'
}) {
  const tones = {
    lagon: 'text-[#0A7EA4] bg-nc-lagonLight',
    emeraude: 'text-nc-emeraude bg-nc-emeraudeLight',
    corail: 'text-coral bg-coral/10',
    amber: 'text-amber-600 bg-amber-50',
  } as const

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-night/60">{title}</p>
      <p className="mt-1 text-3xl font-bold text-night">{value}</p>
      <p className="mt-2 text-sm text-night/55">{subtitle}</p>
    </article>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="h-24 animate-pulse rounded-[2rem] bg-sand/70 sm:h-28" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-sand/70 sm:h-36" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-[2rem] bg-sand/70 sm:h-80" />
    </div>
  )
}

export default function ProDashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const response = await proApi.getDashboard()
        if (!alive) return
        setData(response.data?.data ?? null)
      } catch {
        if (!alive) return
        setData(null)
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const chartData = useMemo(
    () => data?.timeline_30d ?? [],
    [data]
  )

  if (loading) {
    return <DashboardSkeleton />
  }

  const stats = data?.stats ?? {
    views_total: 0,
    views_7d: 0,
    views_30d: 0,
    contacts_total: 0,
    contacts_7d: 0,
    avg_conversion_rate: 0,
  }
  const unreadMessages = data?.unread_messages_total ?? 0
  const unreadClients = data?.unread_clients_total ?? 0
  const unreadConversations = data?.unread_conversations_total ?? 0
  const unreadThreads = data?.unread_threads ?? []

  const listings = data?.listings ?? {
    total: 0,
    active: 0,
    boosted: 0,
    expired: 0,
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ProOnboardingGuide />

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Bonjour</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-night sm:text-3xl">
              {user?.first_name || user?.prenom || 'Professionnel'} 👋
            </h1>
            <p className="mt-2 text-sm text-night/60">Voici les performances de votre vitrine.</p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            <BadgeCheck className="h-4 w-4" />
            Pro vérifié ✓
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#0A7EA4]/15 bg-gradient-to-br from-nc-lagonLight via-white to-nc-emeraudeLight p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Pack de lancement</p>
            <h2 className="mt-1 font-display text-xl font-bold text-night sm:text-2xl">Accélérez votre démarrage Pro avec un parcours guidé</h2>
            <p className="mt-2 text-sm text-night/65">
              Retrouvez vos étapes prioritaires, de la vitrine à la première annonce, en passant par le catalogue, les rendez-vous et les devis.
            </p>
          </div>
          <Link href="/pro/dashboard/pack-lancement" className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm sm:w-auto">
            Ouvrir le pack
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <ProScoreWidget
        listings={listings}
        stats={stats}
        unreadMessages={unreadMessages}
        unreadClients={unreadClients}
        unreadConversations={unreadConversations}
        boostsActiveCount={data?.boosts_active?.length ?? 0}
        topListingsCount={data?.top_listings?.length ?? 0}
        recentContactsCount={data?.recent_contacts?.length ?? 0}
      />

      <section id="stats" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Eye}
          title="Vues totales"
          value={`${stats.views_total.toLocaleString('fr-FR')}`}
          subtitle={`+${stats.views_7d.toLocaleString('fr-FR')} cette semaine`}
          tone="lagon"
        />
        <KpiCard
          icon={MessageCircle}
          title="Contacts reçus"
          value={`${stats.contacts_total.toLocaleString('fr-FR')}`}
          subtitle={`+${stats.contacts_7d.toLocaleString('fr-FR')} cette semaine`}
          tone="emeraude"
        />
        <KpiCard
          icon={TrendingUp}
          title="Taux de conversion"
          value={`${Number(stats.avg_conversion_rate ?? 0).toFixed(1)}%`}
          subtitle="Vues → contacts"
          tone="corail"
        />
        <KpiCard
          icon={Zap}
          title="Dépenses boosts"
          value={`${Number(data?.spend_30d_xpf ?? 0).toLocaleString('fr-FR')} XPF`}
          subtitle="Ce mois-ci"
          tone="amber"
        />
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Catalogue produit</p>
              <h2 className="mt-1 font-display text-xl font-bold text-night sm:text-2xl">Créez votre vitrine de produits</h2>
              <p className="mt-2 text-sm text-night/60">
                Centralisez vos fiches produits fixes, suivez le stock et publiez une annonce ponctuelle quand vous voulez booster une référence.
              </p>
            </div>
          </div>
          <Link href="/pro/dashboard/produits" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0A7EA4]/15 bg-nc-lagonLight px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10 sm:w-auto">
            Ouvrir le catalogue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Performance</p>
              <h2 className="mt-1 font-display text-xl font-bold text-night sm:text-2xl">Vues et contacts sur 30 jours</h2>
            </div>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(8,32,50,0.08)" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: 16, border: '1px solid rgba(8,32,50,0.08)' }}
                  labelStyle={{ fontWeight: 700 }}
                />
                <Line type="monotone" dataKey="views" name="Vues" stroke="#0A7EA4" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="contacts" name="Contacts" stroke="#0f9d58" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Annonces</p>
                <h2 className="mt-1 font-display text-xl font-bold text-night sm:text-2xl">Vos chiffres clés</h2>
              </div>
              <span className="rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold text-nc-lagon">
                {listings.active}/{listings.total} actives
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
                <p className="text-night/55">Boostées</p>
                <p className="mt-1 text-xl font-bold text-night">{listings.boosted}</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
                <p className="text-night/55">Expirées</p>
                <p className="mt-1 text-xl font-bold text-night">{listings.expired}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Boosts actifs</p>
                <h2 className="mt-1 font-display text-lg font-bold text-night sm:text-xl">En cours</h2>
              </div>
            </div>
            {data?.boosts_active?.length ? (
              <div className="space-y-3">
                {data.boosts_active.slice(0, 3).map((boost) => {
                  const expiresAt = new Date(boost.expires_at)
                  const startedAt = new Date(boost.started_at)
                  const durationMs = Math.max(1, expiresAt.getTime() - startedAt.getTime())
                  const remaining = Math.max(0, expiresAt.getTime() - Date.now())
                  const progress = Math.max(0, Math.min(100, ((durationMs - remaining) / durationMs) * 100))

                  return (
                    <div key={boost.id} className="rounded-2xl border border-[var(--color-border)] p-3">
                      <div className="flex items-center gap-3">
                        {boost.cover_image ? (
                          <Image
                            src={boost.cover_image}
                            alt={boost.listing_title}
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-nc-lagonLight" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-night">{boost.listing_title}</p>
                          <p className="text-xs text-night/55">
                            Boost du {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(startedAt)}
                            {' '}au {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(expiresAt)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-sand">
                        <div className="h-2 rounded-full bg-[#0A7EA4]" style={{ width: `${Math.min(100, progress)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-night/60">
                Aucun boost actif pour le moment.
              </div>
            )}
          </article>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Messages à traiter</p>
            <h2 className="mt-1 font-display text-xl font-bold text-night sm:text-2xl">Vos messages non lus</h2>
            <p className="mt-2 text-sm text-night/60">
              Vue consolidée des messages en attente, avec les clients à rappeler en priorité.
            </p>
          </div>
          <Link href="/messages" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0A7EA4]/15 bg-nc-lagonLight px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10 sm:w-auto">
            Ouvrir la messagerie
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <p className="text-sm font-semibold text-night/55">Messages non lus</p>
            <p className="mt-2 text-2xl font-bold text-night sm:text-3xl">{unreadMessages.toLocaleString('fr-FR')}</p>
          </article>
          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <p className="text-sm font-semibold text-night/55">Clients différents</p>
            <p className="mt-2 text-2xl font-bold text-night sm:text-3xl">{unreadClients.toLocaleString('fr-FR')}</p>
          </article>
          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <p className="text-sm font-semibold text-night/55">Conversations en attente</p>
            <p className="mt-2 text-2xl font-bold text-night sm:text-3xl">{unreadConversations.toLocaleString('fr-FR')}</p>
          </article>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Priorité</p>
            <span className="text-xs font-medium text-night/45">5 conversations maximum affichées</span>
          </div>
          {unreadThreads.length ? (
            <div className="space-y-3">
              {unreadThreads.map((thread) => {
                const buyerName = [thread.buyer_prenom, thread.buyer_nom].filter(Boolean).join(' ').trim() || 'Client'
                const initials = buyerName
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() || '')
                  .join('')
                  .slice(0, 2) || 'C'

                return (
                  <div key={thread.conversation_id} className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-nc-lagonLight text-sm font-bold text-[#0A7EA4]">
                        {thread.buyer_avatar_url ? (
                          <Image src={thread.buyer_avatar_url} alt={buyerName} width={48} height={48} className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-night">{buyerName}</h3>
                          <span className="rounded-full bg-coral/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-coral">
                            {thread.unread_count} non lus
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-night/60">
                          {thread.listing_title || 'Annonce'} · Conversation #{thread.conversation_id}
                        </p>
                        {thread.last_unread_message ? (
                          <p className="mt-2 line-clamp-2 text-sm text-night/70">{thread.last_unread_message}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <Link href={`/messages?user=${thread.buyer_id}`} className="rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
                        Répondre
                      </Link>
                      <Link href={`/messages?conv=${thread.conversation_id}`} className="btn-primary rounded-2xl px-4 py-2 text-sm">
                        Ouvrir
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-night/60">
              Aucun message non lu pour le moment.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Top annonces</p>
              <h2 className="mt-1 font-display text-xl font-bold text-night sm:text-2xl">Vos meilleures annonces</h2>
            </div>
            <Link href="/pro/dashboard/annonces" className="hidden items-center gap-1 text-sm font-semibold text-coral hover:underline md:inline-flex">
              Gérer les annonces <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {data?.top_listings?.length ? (
            <div className="space-y-3">
              {data.top_listings.slice(0, 3).map((listing) => (
                <div key={listing.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] p-3 sm:flex-row">
                  <div className="h-20 w-full overflow-hidden rounded-xl bg-sand sm:h-20 sm:w-28">
                    {listing.cover_image ? (
                      <Image src={listing.cover_image} alt={listing.title} width={120} height={80} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-sm font-semibold text-night">{listing.title || listing.titre}</h3>
                    <p className="mt-1 text-sm text-night/60">
                      👁 {Number(listing.total_views ?? 0)} vues · 💬 {Number(listing.total_contacts ?? 0)} contacts · {Number(listing.conversion_rate ?? 0).toFixed(1)}%
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/annonces/${listing.id}`} className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
                        Voir
                      </Link>
                      <button
                        type="button"
                        onClick={() => window.location.assign(`/pro/dashboard/annonces?boost=${listing.id}`)}
                        className="rounded-xl bg-[#0A7EA4] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                      >
                        Booster
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-night/60">
              Aucune donnée disponible pour le moment.
            </div>
          )}
        </article>

        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Contacts récents</p>
            <h2 className="mt-1 font-display text-xl font-bold text-night sm:text-2xl">Derniers contacts reçus</h2>
          </div>
          {data?.recent_contacts?.length ? (
            <div className="space-y-3">
              {data.recent_contacts.slice(0, 5).map((contact) => (
                <div key={contact.id} className="rounded-2xl border border-[var(--color-border)] p-3">
                  <p className="text-sm font-semibold text-night">{contact.listing_title}</p>
                  <p className="mt-1 text-sm text-night/60">{contact.contact_type || 'message'}</p>
                  <p className="mt-1 text-xs text-night/45">
                    {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(contact.contacted_at))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-night/60">
              Aucun contact récent.
            </div>
          )}
        </article>
      </section>
    </div>
  )
}
