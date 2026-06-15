'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  Circle,
  ImageIcon,
  Loader2,
  Megaphone,
  Package,
  Phone,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react'

import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { proLaunchPackApi } from '@/lib/api'
import { showToast } from '@/lib/toast'

type LaunchPackStep = {
  step_key: string
  title: string
  description: string
  href: string
  cta: string
  icon: ComponentType<{ className?: string }>
  points: number
  completed: boolean
  completed_at: string | null
  highlighted?: boolean
}

type LaunchPackStepMeta = {
  step_key: string
  title: string
  description: string
  href: string
  cta: string
  icon: ComponentType<{ className?: string }>
  highlighted?: boolean
}

type LaunchPackData = {
  pack: {
    id: number
    status: string
    call_scheduled_at: string | null
    call_phone: string | null
    call_notes: string | null
    completed_at: string | null
    expires_at: string | null
  } | null
  steps: LaunchPackStep[]
  progress: {
    completed_steps: number
    total_steps: number
    completed_points: number
    total_points: number
    completion_rate: number
    is_completed: boolean
  }
  next_step: LaunchPackStep | null
  stats: {
    listing_count: number
    product_count: number
    views_total: number
    contacts_total: number
    boosted_active_count: number
    booking_slots_count: number
    booking_enabled: boolean
  }
  profile: {
    company_name: string | null
    category: string | null
    description: string | null
    commune: string | null
    website: string | null
    phone: string | null
    hours: string | null
    siret: string | null
    logo_url: string | null
    banner_url: string | null
    quote_template: Record<string, unknown>
  }
}

const STEP_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  profile_complete: Store,
  logo_added: ImageIcon,
  storefront_complete: BadgeCheck,
  first_listing: Megaphone,
  booking_quote_ready: CalendarDays,
  stats_followup: BarChart3,
}

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromDatetimeLocalValue(value: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function formatDateTime(iso: string | null) {
  if (!iso) return 'Non planifié'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Non planifié'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date)
}

function DashboardSkeleton() {
  return (
    <section className="space-y-6">
      <div className="h-28 animate-pulse rounded-[2rem] bg-sand/70" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-2xl bg-sand/70" />
        ))}
      </div>
    </section>
  )
}

const STEP_META: LaunchPackStepMeta[] = [
  {
    step_key: 'profile_complete',
    title: 'Complétez vos infos',
    description: 'Ajoutez le nom de votre entreprise, votre commune et vos coordonnées.',
    href: '/pro/dashboard/parametres',
    cta: 'Renseigner le profil',
    icon: Store,
  },
  {
    step_key: 'logo_added',
    title: 'Ajoutez votre logo',
    description: 'Une identité visuelle claire rassure et rend votre vitrine plus mémorable.',
    href: '/pro/dashboard/parametres',
    cta: 'Importer un logo',
    icon: ImageIcon,
  },
  {
    step_key: 'storefront_complete',
    title: 'Soignez votre vitrine',
    description: 'Rédigez une description courte, vos horaires et votre site web.',
    href: '/pro/dashboard/parametres',
    cta: 'Personnaliser',
    icon: BadgeCheck,
  },
  {
    step_key: 'first_listing',
    title: 'Publiez votre première annonce',
    description: 'Mettez en ligne une offre claire pour commencer à attirer des contacts.',
    href: '/pro/dashboard/annonces',
    cta: 'Voir mes annonces',
    icon: Megaphone,
  },
  {
    step_key: 'booking_quote_ready',
    title: 'Préparez vos rendez-vous et devis',
    description: 'Activez la réservation et préparez votre template de devis.',
    href: '/pro/dashboard/rdv',
    cta: 'Voir les rendez-vous',
    icon: CalendarDays,
  },
  {
    step_key: 'stats_followup',
    title: 'Suivez vos statistiques',
    description: 'Consultez vos vues, contacts et performances pour piloter votre activité.',
    href: '/pro/dashboard#stats',
    cta: 'Voir les statistiques',
    icon: BarChart3,
    highlighted: true,
  },
]

export default function ProLaunchPack() {
  const [data, setData] = useState<LaunchPackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingStepKey, setSavingStepKey] = useState<string | null>(null)
  const [savingCall, setSavingCall] = useState(false)
  const [callForm, setCallForm] = useState({
    call_scheduled_at: '',
    call_phone: '',
    call_notes: '',
  })

  const loadPack = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await proLaunchPackApi.get()
      const payload = response.data?.data as LaunchPackData | undefined
      setData(payload || null)
      setCallForm({
        call_scheduled_at: toDatetimeLocalValue(payload?.pack?.call_scheduled_at ?? null),
        call_phone: payload?.pack?.call_phone || '',
        call_notes: payload?.pack?.call_notes || '',
      })
    } catch (err: any) {
      setData(null)
      setError(err?.response?.data?.error || 'Impossible de charger le pack de lancement.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPack()
  }, [])

  const steps = useMemo(() => {
    const stepMap = new Map((data?.steps || []).map((step) => [step.step_key, step]))
    return STEP_META.map((meta) => {
      const serverStep = stepMap.get(meta.step_key)
      return {
        ...meta,
        completed: Boolean(serverStep?.completed),
        completed_at: serverStep?.completed_at || null,
        points: Number(serverStep?.points ?? 1),
      }
    })
  }, [data])

  const completionRate = data?.progress?.completion_rate ?? 0
  const nextStep = data?.next_step ? steps.find((step) => step.step_key === data.next_step?.step_key) || null : steps.find((step) => !step.completed) || null

  const handleCompleteStep = async (stepKey: string) => {
    if (savingStepKey) return
    setSavingStepKey(stepKey)
    setError('')
    try {
      await proLaunchPackApi.completeStep({ step_key: stepKey })
      await loadPack()
      showToast({
        tone: 'success',
        title: 'Étape validée',
        message: 'Votre progression de lancement a été mise à jour.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de valider cette étape.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Étape non validée',
        message,
      })
    } finally {
      setSavingStepKey(null)
    }
  }

  const handleScheduleCall = async () => {
    if (!callForm.call_scheduled_at) {
      setError('Merci de choisir une date pour l’appel onboarding.')
      return
    }

    setSavingCall(true)
    setError('')
    try {
      await proLaunchPackApi.scheduleCall({
        call_scheduled_at: fromDatetimeLocalValue(callForm.call_scheduled_at),
        call_phone: callForm.call_phone.trim() || null,
        call_notes: callForm.call_notes.trim() || null,
      })
      await loadPack()
      showToast({
        tone: 'success',
        title: 'Appel planifié',
        message: 'Votre appel onboarding a bien été enregistré.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de planifier cet appel.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Appel non planifié',
        message,
      })
    } finally {
      setSavingCall(false)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error && !data) {
    return (
      <FeedbackAlert tone="error" title="Pack de lancement indisponible">
        {error}
      </FeedbackAlert>
    )
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Pack de lancement</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Préparez votre démarrage Pro en 6 étapes</h1>
            <p className="mt-3 text-sm leading-relaxed text-night/60">
              Ce parcours vous aide à configurer votre vitrine, publier vos premières offres, activer vos outils de conversion et suivre vos premiers résultats sans vous disperser.
            </p>
          </div>
          <div className="rounded-2xl border border-[#0A7EA4]/15 bg-nc-lagonLight px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0A7EA4]">Livraison rapide</p>
            <p className="mt-1 text-sm font-semibold text-night">Environ 30 minutes pour poser les bases</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-night">
              Progression: {data?.progress?.completed_steps ?? 0}/{data?.progress?.total_steps ?? steps.length} étapes complétées
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">{completionRate}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[#0A7EA4] transition-all duration-300" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      </div>

      {error ? (
        <FeedbackAlert tone="error" title="Alerte">
          {error}
        </FeedbackAlert>
      ) : null}

      {data?.progress?.is_completed ? (
        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Pack terminé</p>
              <h2 className="mt-1 font-display text-2xl font-bold">Votre vitrine est prête à convertir</h2>
              <p className="mt-2 text-sm text-emerald-800/80">
                Vous pouvez continuer à optimiser votre compte, mais les étapes de lancement sont désormais complétées.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step) => {
            const Icon = STEP_ICONS[step.step_key] || Circle
            return (
              <article
                key={step.step_key}
                className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
                  step.highlighted
                    ? 'border-[#0A7EA4] bg-[#0A7EA4]/5 shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-background-secondary)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => void handleCompleteStep(step.step_key)}
                    disabled={step.completed || savingStepKey === step.step_key}
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
                      step.completed
                        ? 'bg-emerald-600 text-white'
                        : step.highlighted
                          ? 'bg-[#0A7EA4] text-white'
                          : 'bg-white text-[#0A7EA4]'
                    }`}
                    aria-label={`${step.completed ? 'Étape validée' : 'Marquer comme fait'} : ${step.title}`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : savingStepKey === step.step_key ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/55">
                        Étape
                      </span>
                      {step.completed ? (
                        <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                          Complétée
                        </span>
                      ) : (
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">
                          À faire
                        </span>
                      )}
                      {step.highlighted ? (
                        <span className="rounded-full bg-[#0A7EA4] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                          Priorité
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-base font-semibold text-night">{step.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-night/60">{step.description}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={step.href}
                    className={`inline-flex items-center gap-2 text-sm font-semibold transition ${
                      step.highlighted ? 'text-[#0A7EA4] hover:underline' : 'text-night hover:text-[#0A7EA4]'
                    }`}
                  >
                    {step.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {!step.completed ? (
                    <button
                      type="button"
                      onClick={() => void handleCompleteStep(step.step_key)}
                      disabled={savingStepKey === step.step_key}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-night transition hover:bg-white disabled:opacity-60"
                    >
                      {savingStepKey === step.step_key ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      Marquer comme fait
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>

        <aside className="space-y-4">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Ce que vous obtenez</p>
                <h2 className="mt-1 font-display text-xl font-bold text-night">Une vitrine prête à convertir</h2>
              </div>
            </div>

            <ul className="mt-4 space-y-3 text-sm text-night/70">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-nc-emeraude" />
                Un profil Pro clair, rassurant et complet
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-nc-emeraude" />
                Des premières annonces prêtes à recevoir des contacts
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-nc-emeraude" />
                Des rendez-vous et devis configurés pour convertir plus vite
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-nc-emeraude" />
                Un suivi clair des vues, contacts et boosts
              </li>
            </ul>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Appel onboarding</p>
                <h2 className="mt-1 font-display text-xl font-bold text-night">Planifier un appel</h2>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-night/60">
              Réservez un créneau pour faire le point avec l'équipe Kalico et accélérer votre démarrage.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Date et heure</span>
                <input
                  type="datetime-local"
                  value={callForm.call_scheduled_at}
                  onChange={(event) => setCallForm((current) => ({ ...current, call_scheduled_at: event.target.value }))}
                  className="input w-full rounded-2xl"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Téléphone</span>
                <input
                  value={callForm.call_phone}
                  onChange={(event) => setCallForm((current) => ({ ...current, call_phone: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="Numéro à rappeler"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Notes</span>
                <textarea
                  value={callForm.call_notes}
                  onChange={(event) => setCallForm((current) => ({ ...current, call_notes: event.target.value }))}
                  rows={4}
                  className="input w-full rounded-2xl py-3"
                  placeholder="Points à aborder pendant l'appel..."
                />
              </label>

              <button
                type="button"
                onClick={() => void handleScheduleCall()}
                disabled={savingCall}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:opacity-60"
              >
                {savingCall ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                {data?.pack?.call_scheduled_at ? 'Modifier l’appel' : 'Planifier mon appel'}
              </button>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4 text-sm text-night/70">
                <p className="font-semibold text-night">Appel planifié</p>
                <p className="mt-1">{formatDateTime(data?.pack?.call_scheduled_at ?? null)}</p>
                {data?.pack?.call_phone ? <p className="mt-1">Téléphone: {data.pack.call_phone}</p> : null}
                {data?.pack?.call_notes ? <p className="mt-1 whitespace-pre-line">{data.pack.call_notes}</p> : null}
              </div>
            </div>
          </article>
        </aside>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Prochaine étape</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">
            {nextStep ? nextStep.title : 'Vous avez complété le parcours'}
          </h2>
          <p className="mt-2 text-sm text-night/60">
            {nextStep
              ? nextStep.description
              : 'Continuez à optimiser votre compte grâce à vos annonces, vos rendez-vous et vos devis.'}
          </p>
        </article>

        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Raccourcis</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Aller plus vite</h2>

          <div className="mt-4 grid gap-2">
            <Link href="/pro/dashboard/parametres" className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
              Finaliser la vitrine
            </Link>
            <Link href="/pro/dashboard/produits" className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
              Ajouter un produit
            </Link>
            <Link href="/pro/dashboard/rdv" className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
              Gérer les rendez-vous
            </Link>
            <Link href="/pro/dashboard/devis" className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
              Voir les devis
            </Link>
          </div>
        </article>
      </div>

      <div className="flex items-center gap-2 text-xs font-medium text-night/55">
        <Circle className="h-3.5 w-3.5 text-nc-emeraude" />
        Le pack de lancement est désormais piloté par le serveur pour garder votre progression sur tous vos appareils.
      </div>
    </section>
  )
}
