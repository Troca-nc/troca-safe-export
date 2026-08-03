'use client'

import type { ElementType, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Bell,
  Mail,
  MessageCircle,
  Megaphone,
  MonitorSmartphone,
  Save,
  Sparkles,
  Store,
  Tag,
  Volume2,
} from 'lucide-react'

import Header from '@/components/layout/Header'
import { bonPlansApi, notificationsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useAuthSessionSync } from '@/hooks/useAuthSessionSync'

type NotificationPrefs = {
  email_new_message: boolean
  push_new_message: boolean
  email_search_alert: boolean
  push_search_alert: boolean
  email_boost_activated: boolean
  email_offer_received: boolean
  email_listing_expiring: boolean
  email_listing_expired: boolean
  email_performance_report: boolean
  push_performance_report: boolean
  performance_report_frequency: 'daily' | 'weekly' | 'monthly' | 'never'
}

type BonPlanPrefs = {
  notify_all: boolean
  notify_categories: string[]
  notify_businesses: string[]
  via_push: boolean
  via_email: boolean
}

const STORAGE_PREFIX = 'kalico-demo-notification-prefs'
const BON_PLANS_STORAGE_PREFIX = 'kalico-demo-bon-plan-prefs'

const BON_PLAN_CATEGORIES = [
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'mode', label: 'Mode' },
  { value: 'beaute', label: 'Beaut�' },
  { value: 'high_tech', label: 'High-tech' },
  { value: 'auto_moto', label: 'Auto / Moto' },
  { value: 'maison', label: 'Maison' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'services', label: 'Services' },
  { value: 'sport', label: 'Sport' },
  { value: 'voyages', label: 'Voyages' },
] as const

const QUICK_LINKS = [
  { href: '#messages', label: 'Messages', tone: 'coral' as const },
  { href: '#alerts', label: 'Alertes', tone: 'lagoon' as const },
  { href: '#reports', label: 'Rapports', tone: 'jungle' as const },
  { href: '#bons-plans', label: 'Bons Plans', tone: 'ocean' as const },
] as const

const toneStyles = {
  coral: {
    panel: 'border-coral/15 bg-coral/5',
    icon: 'bg-coral/10 text-coral',
  },
  lagoon: {
    panel: 'border-lagoon/15 bg-lagoon/5',
    icon: 'bg-lagoon/10 text-lagoon',
  },
  jungle: {
    panel: 'border-jungle/15 bg-jungle/5',
    icon: 'bg-jungle/10 text-jungle',
  },
  ocean: {
    panel: 'border-ocean/15 bg-ocean/5',
    icon: 'bg-ocean/10 text-ocean',
  },
} as const

function defaultNotificationPrefs(): NotificationPrefs {
  return {
    email_new_message: true,
    push_new_message: true,
    email_search_alert: true,
    push_search_alert: true,
    email_boost_activated: true,
    email_offer_received: true,
    email_listing_expiring: true,
    email_listing_expired: true,
    email_performance_report: true,
    push_performance_report: false,
    performance_report_frequency: 'weekly',
  }
}

function defaultBonPlanPrefs(): BonPlanPrefs {
  return {
    notify_all: false,
    notify_categories: [],
    notify_businesses: [],
    via_push: true,
    via_email: false,
  }
}

function readDemoPrefs<T>(key: string, fallback: T): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<T>
    return { ...fallback, ...parsed } as T
  } catch {
    return null
  }
}

function saveDemoPrefs(key: string, prefs: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(prefs))
}

function SectionCard({
  id,
  title,
  description,
  icon: Icon,
  tone = 'coral',
  children,
}: {
  id?: string
  title: string
  description: string
  icon: ElementType
  tone?: keyof typeof toneStyles
  children: ReactNode
}) {
  const palette = toneStyles[tone]

  return (
    <section id={id} className={`rounded-[1.75rem] border ${palette.panel} bg-[var(--color-surface)] p-5 shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${palette.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-night">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-night/60">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  icon: Icon,
  tone = 'coral',
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  icon: ElementType
  tone?: keyof typeof toneStyles
}) {
  const palette = toneStyles[tone]

  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4 transition duration-150 hover:bg-[var(--color-background-tertiary)]">
      <span className="flex min-w-0 items-start gap-3">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${palette.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-night">{title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-night/55">{description}</span>
        </span>
      </span>
      <span
        className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-night/10 transition data-[checked=true]:bg-coral"
        data-checked={checked ? 'true' : 'false'}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={title}
        />
        <span className="ml-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

export default function NotificationPreferencesPage() {
  const router = useRouter()
  const { user, demoProfile, hasHydrated } = useAuthStore()
  useAuthSessionSync()
  const isDemo = Boolean(demoProfile)

  const notificationStorageKey = useMemo(() => `${STORAGE_PREFIX}:${demoProfile ?? 'visitor'}`, [demoProfile])
  const bonPlanStorageKey = useMemo(() => `${BON_PLANS_STORAGE_PREFIX}:${demoProfile ?? 'visitor'}`, [demoProfile])

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs())
  const [bonPlanPrefs, setBonPlanPrefs] = useState<BonPlanPrefs>(defaultBonPlanPrefs())
  const [bonPlanBusinesses, setBonPlanBusinesses] = useState<Array<{ name: string }>>([])
  const [bonPlanBusinessInput, setBonPlanBusinessInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!hasHydrated) return
    if (!user && !demoProfile) {
      router.replace('/connexion')
      return
    }

    let alive = true

    async function load() {
      setLoading(true)
      setMessage(null)

      try {
        if (isDemo) {
          const storedNotificationPrefs = readDemoPrefs(notificationStorageKey, defaultNotificationPrefs())
          const storedBonPlanPrefs = readDemoPrefs(bonPlanStorageKey, defaultBonPlanPrefs())
          if (alive) {
            setNotificationPrefs(storedNotificationPrefs ?? defaultNotificationPrefs())
            setBonPlanPrefs(storedBonPlanPrefs ?? defaultBonPlanPrefs())
          }
          return
        }

        const [notificationResponse, bonPlanResponse, businessesResponse] = await Promise.all([
          notificationsApi.getPreferences(),
          bonPlansApi.getPrefs(),
          bonPlansApi.businesses(),
        ])

        if (!alive) return

        const notificationCurrent = notificationResponse.data?.data ?? {}
        const bonPlanCurrent = bonPlanResponse.data?.data ?? {}

        setNotificationPrefs({
          email_new_message: notificationCurrent.email_new_message !== false,
          push_new_message: notificationCurrent.push_new_message !== false,
          email_search_alert: notificationCurrent.email_search_alert !== false,
          push_search_alert: notificationCurrent.push_search_alert !== false,
          email_boost_activated: notificationCurrent.email_boost_activated !== false,
          email_offer_received: notificationCurrent.email_offer_received !== false,
          email_listing_expiring: notificationCurrent.email_listing_expiring !== false,
          email_listing_expired: notificationCurrent.email_listing_expired !== false,
          email_performance_report: notificationCurrent.email_performance_report !== false,
          push_performance_report: notificationCurrent.push_performance_report === true,
          performance_report_frequency: notificationCurrent.performance_report_frequency ?? 'weekly',
        })

        setBonPlanPrefs({
          notify_all: Boolean(bonPlanCurrent.notify_all),
          notify_categories: Array.isArray(bonPlanCurrent.notify_categories) ? bonPlanCurrent.notify_categories : [],
          notify_businesses: Array.isArray(bonPlanCurrent.notify_businesses) ? bonPlanCurrent.notify_businesses : [],
          via_push: bonPlanCurrent.via_push !== false,
          via_email: bonPlanCurrent.via_email === true,
        })
        setBonPlanBusinesses(Array.isArray(businessesResponse.data?.data) ? businessesResponse.data.data : [])
      } catch {
        if (!alive) return
        setMessage('Les pr�f�rences sont momentan�ment indisponibles.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [bonPlanStorageKey, demoProfile, hasHydrated, isDemo, notificationStorageKey, router, user])

  const updateNotificationPrefs = <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => {
    setNotificationPrefs((current) => ({ ...current, [key]: value }))
  }

  const updateBonPlanPrefs = <K extends keyof BonPlanPrefs>(key: K, value: BonPlanPrefs[K]) => {
    setBonPlanPrefs((current) => ({ ...current, [key]: value }))
  }

  const toggleCategory = (value: string) => {
    setBonPlanPrefs((current) => ({
      ...current,
      notify_categories: current.notify_categories.includes(value)
        ? current.notify_categories.filter((item) => item !== value)
        : [...current.notify_categories, value],
    }))
  }

  const addBusiness = () => {
    const nextName = bonPlanBusinessInput.trim()
    if (!nextName) return

    setBonPlanPrefs((current) => ({
      ...current,
      notify_businesses: Array.from(new Set([...current.notify_businesses, nextName])),
    }))
    setBonPlanBusinessInput('')
  }

  const removeBusiness = (business: string) => {
    setBonPlanPrefs((current) => ({
      ...current,
      notify_businesses: current.notify_businesses.filter((item) => item !== business),
    }))
  }

  const activeMessageChannels = [notificationPrefs.email_new_message, notificationPrefs.push_new_message].filter(Boolean).length
  const activeBonPlanCategories = bonPlanPrefs.notify_categories.length

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      if (isDemo) {
        saveDemoPrefs(notificationStorageKey, notificationPrefs)
        saveDemoPrefs(bonPlanStorageKey, bonPlanPrefs)
        setMessage('Pr�f�rences d�mo enregistr�es localement.')
        return
      }

      await Promise.all([
        notificationsApi.savePreferences(notificationPrefs),
        bonPlansApi.savePrefs(bonPlanPrefs),
      ])
      setMessage('Vos pr�f�rences ont �t� enregistr�es.')
    } catch {
      setMessage('Impossible denregistrer vos pr�f�rences pour le moment.')
    } finally {
      setSaving(false)
    }
  }

  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="card animate-pulse p-6">
            <div className="skeleton h-7 w-56 rounded-full" />
            <div className="mt-4 space-y-3">
              <div className="skeleton h-24 rounded-[1.5rem]" />
              <div className="skeleton h-24 rounded-[1.5rem]" />
              <div className="skeleton h-24 rounded-[1.5rem]" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="overflow-hidden rounded-[2rem] border border-coral/15 bg-[linear-gradient(135deg,rgba(10,126,164,0.08),rgba(244,248,247,1)_45%,rgba(72,202,228,0.08))] p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
                <Bell className="h-3.5 w-3.5" />
                Centre unique de notifications
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold text-night md:text-5xl">
                Choisissez ce qui vous alerte, et comment.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-night/65 md:text-base">
                Centralisez ici les messages, les alertes doffres, les rapports de performance et les Bons Plans.
                Chaque cat�gorie peut �tre ajust�e pour lemail, le push mobile ou les deux.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-night/65 shadow-xs">
                {activeMessageChannels} canal{activeMessageChannels > 1 ? 'aux' : ''} actif{activeMessageChannels > 1 ? 's' : ''}
              </span>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-night/65 shadow-xs">
                {activeBonPlanCategories} cat�gorie{activeBonPlanCategories > 1 ? 's' : ''} Bons Plans
              </span>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-night/65 shadow-xs">
                Email + push
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_LINKS.map((item) => {
              const palette = toneStyles[item.tone]
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-night/65 shadow-xs transition hover:-translate-y-0.5 hover:border-coral/20 hover:text-night"
                >
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${palette.icon}`}>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                  {item.label}
                </a>
              )
            })}
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-night/70 shadow-xs">
            {message}
          </div>
        )}

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-5">
            <SectionCard
              id="messages"
              title="Nouveau message"
              description="Recevez les r�ponses dannonce et les nouvelles conversations par email ou en push."
              icon={MessageCircle}
              tone="coral"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleRow
                  title="Email"
                  description="Un email � chaque nouveau message re�u."
                  checked={notificationPrefs.email_new_message}
                  onChange={(checked) => updateNotificationPrefs('email_new_message', checked)}
                  icon={Mail}
                  tone="coral"
                />
                <ToggleRow
                  title="Push mobile"
                  description="Une notification discr�te saffiche sur votre t�l�phone."
                  checked={notificationPrefs.push_new_message}
                  onChange={(checked) => updateNotificationPrefs('push_new_message', checked)}
                  icon={MonitorSmartphone}
                  tone="coral"
                />
              </div>
            </SectionCard>

            <SectionCard
              id="alerts"
              title="Alertes doffres"
              description="Les nouvelles annonces correspondant � vos recherches peuvent vous �tre envoy�es par email et/ou en push."
              icon={Megaphone}
              tone="lagoon"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleRow
                  title="Email"
                  description="Recevez les alertes dannonces qui correspondent � vos crit�res."
                  checked={notificationPrefs.email_search_alert}
                  onChange={(checked) => updateNotificationPrefs('email_search_alert', checked)}
                  icon={Mail}
                  tone="lagoon"
                />
                <ToggleRow
                  title="Push mobile"
                  description="Une alerte push compl�te lemail sur les recherches importantes."
                  checked={notificationPrefs.push_search_alert}
                  onChange={(checked) => updateNotificationPrefs('push_search_alert', checked)}
                  icon={Volume2}
                  tone="lagoon"
                />
              </div>
            </SectionCard>

            <SectionCard
              id="listing-alerts"
              title="Annonces, boosts et expirations"
              description="Suivez les boosts, les offres re�ues et les rappels dexpiration dannonce par email."
              icon={Tag}
              tone="ocean"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleRow
                  title="Boost dannonce"
                  description="Recevez un email quand votre boost est activ�."
                  checked={notificationPrefs.email_boost_activated}
                  onChange={(checked) => updateNotificationPrefs('email_boost_activated', checked)}
                  icon={Sparkles}
                  tone="ocean"
                />
                <ToggleRow
                  title="Nouvelle offre"
                  description="Un email d�s quune offre arrive dans la messagerie."
                  checked={notificationPrefs.email_offer_received}
                  onChange={(checked) => updateNotificationPrefs('email_offer_received', checked)}
                  icon={MessageCircle}
                  tone="ocean"
                />
                <ToggleRow
                  title="Annonce bient�t expir�e"
                  description="Recevez le rappel 3 jours avant l�ch�ance."
                  checked={notificationPrefs.email_listing_expiring}
                  onChange={(checked) => updateNotificationPrefs('email_listing_expiring', checked)}
                  icon={Bell}
                  tone="ocean"
                />
                <ToggleRow
                  title="Annonce expir�e"
                  description="Un email quand lannonce est r�ellement expir�e."
                  checked={notificationPrefs.email_listing_expired}
                  onChange={(checked) => updateNotificationPrefs('email_listing_expired', checked)}
                  icon={Tag}
                  tone="ocean"
                />
              </div>
            </SectionCard>

            <SectionCard
              id="reports"
              title="Rapports de performance"
              description="Suivez les vues, clics et favoris de vos annonces avec une cadence adapt�e � votre activit�."
              icon={Sparkles}
              tone="jungle"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleRow
                  title="Email r�capitulatif"
                  description="Un rapport simple pour les particuliers, plus complet pour les professionnels."
                  checked={notificationPrefs.email_performance_report}
                  onChange={(checked) => updateNotificationPrefs('email_performance_report', checked)}
                  icon={Mail}
                  tone="jungle"
                />
                <ToggleRow
                  title="Push mobile"
                  description="Recevez un rappel discret quand un rapport est pr�t."
                  checked={notificationPrefs.push_performance_report}
                  onChange={(checked) => updateNotificationPrefs('push_performance_report', checked)}
                  icon={MonitorSmartphone}
                  tone="jungle"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                <label className="block text-sm font-semibold text-night">Fr�quence du rapport</label>
                <p className="mt-1 text-xs leading-relaxed text-night/55">
                  Les comptes professionnels peuvent choisir une cadence quotidienne, hebdomadaire, mensuelle ou larr�ter.
                </p>
                <select
                  value={notificationPrefs.performance_report_frequency}
                  onChange={(event) => updateNotificationPrefs('performance_report_frequency', event.target.value as NotificationPrefs['performance_report_frequency'])}
                  className="mt-3 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-night outline-none transition focus:border-coral focus:ring-4 focus:ring-coral/10"
                >
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                  <option value="never">Jamais</option>
                </select>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <SectionCard
              id="bons-plans"
              title="Bons Plans & promotions"
              description="Choisissez si vous voulez recevoir les promos, par canal, par cat�gorie ou par enseigne."
              icon={Store}
              tone="ocean"
            >
              <div className="space-y-4">
                <ToggleRow
                  title="Toutes les nouvelles promos"
                  description="Recevoir chaque bon plan publi� sur Kalico."
                  checked={bonPlanPrefs.notify_all}
                  onChange={(checked) => updateBonPlanPrefs('notify_all', checked)}
                  icon={Tag}
                  tone="ocean"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <ToggleRow
                    title="Push mobile"
                    description="Recevoir les promotions les plus utiles en notification."
                    checked={bonPlanPrefs.via_push}
                    onChange={(checked) => updateBonPlanPrefs('via_push', checked)}
                    icon={MonitorSmartphone}
                    tone="ocean"
                  />
                  <ToggleRow
                    title="Par email"
                    description="Une synth�se des meilleures promos dans votre bo�te de r�ception."
                    checked={bonPlanPrefs.via_email}
                    onChange={(checked) => updateBonPlanPrefs('via_email', checked)}
                    icon={Mail}
                    tone="ocean"
                  />
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-night">Cat�gories favorites</label>
                      <p className="mt-1 text-xs leading-relaxed text-night/55">
                        Cochez une ou plusieurs familles pour filtrer les promotions utiles.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-night/50">
                      {activeBonPlanCategories} s�lectionn�e{activeBonPlanCategories > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {BON_PLAN_CATEGORIES.map((category) => {
                      const active = bonPlanPrefs.notify_categories.includes(category.value)
                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => toggleCategory(category.value)}
                          className={`rounded-full border px-3 py-2 text-xs font-medium transition duration-150 ${
                            active
                              ? 'border-coral bg-coral text-white'
                              : 'border-[var(--color-border)] bg-white text-night/65 hover:border-coral/30 hover:bg-coral/5 hover:text-coral'
                          }`}
                        >
                          {category.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                  <label className="block text-sm font-semibold text-night">Enseignes favorites</label>
                  <p className="mt-1 text-xs leading-relaxed text-night/55">
                    Ajoutez les marques ou commerces que vous souhaitez suivre plus attentivement.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      list="bon-plans-businesses"
                      value={bonPlanBusinessInput}
                      onChange={(event) => setBonPlanBusinessInput(event.target.value)}
                      placeholder="Ajouter une enseigne"
                      className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-night outline-none transition focus:border-coral focus:ring-4 focus:ring-coral/10"
                    />
                    <button
                      type="button"
                      onClick={addBusiness}
                      className="inline-flex items-center gap-2 rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
                    >
                      Ajouter
                    </button>
                  </div>
                  <datalist id="bon-plans-businesses">
                    {bonPlanBusinesses.map((business) => (
                      <option key={business.name} value={business.name} />
                    ))}
                  </datalist>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {bonPlanPrefs.notify_businesses.length === 0 ? (
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs text-night/45">
                        Aucune enseigne enregistr�e pour le moment
                      </span>
                    ) : (
                      bonPlanPrefs.notify_businesses.map((business) => (
                        <span
                          key={business}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-night/70"
                        >
                          {business}
                          <button
                            type="button"
                            onClick={() => removeBusiness(business)}
                            className="text-night/30 transition hover:text-coral"
                            aria-label={`Retirer ${business}`}
                          >
                            �
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-jungle/15 bg-jungle/5 p-4 text-sm text-night/65">
                  Les Bons Plans sont g�r�s dans le m�me centre que vos alertes et rappels. Vous pouvez tout ajuster en une seule fois.
                </div>
              </div>
            </SectionCard>

            <section className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-night">Confidentialit� et d�sabonnement</h2>
                  <p className="mt-1 text-sm leading-relaxed text-night/60">
                    Chaque email contient un lien direct pour couper la cat�gorie concern�e sans connexion. Vous pouvez aussi revenir ici � tout moment.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/politique-de-confidentialite" className="btn-ghost px-4 py-2 text-sm">
                  Lire la politique
                </Link>
                <Link href="/parametres" className="btn-secondary px-4 py-2 text-sm">
                  Retour aux param�tres
                </Link>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Enregistrement</p>
            <p className="mt-2 text-sm leading-relaxed text-night/65">
              Vous pouvez modifier vos canaux � tout moment. Les changements sappliquent imm�diatement sur le web et sur mobile.
            </p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-5 py-3 text-sm">
            {saving ? (
              'Enregistrement&'
            ) : (
              <span className="inline-flex items-center gap-2">
                <Save className="h-4 w-4" />
                Enregistrer mes pr�f�rences
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
