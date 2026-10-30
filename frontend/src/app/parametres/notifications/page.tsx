'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, BarChart3, BellRing, MessageCircle, Search, ShieldCheck, Store, Tag } from 'lucide-react'

import Header from '@/components/layout/Header'
import { ChannelHeadings, PreferenceRow, PreferencesNav, PreferencesSection, SafeLink, SaveBar } from '@/components/notifications/NotificationPreferencesUI'
import { Button } from '@/components/ui/Button'
import { FilterChip, SegmentedControl, Switch } from '@/components/ui/Controls'
import { Input } from '@/components/ui/Field'
import { useAuthSessionSync } from '@/hooks/useAuthSessionSync'
import {
  BON_PLAN_CATEGORIES,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type BonPlanPreferences,
  type NotificationPreferences,
  type NotificationPreferencesData,
} from '@/lib/data/notifications'
import { useAuthStore } from '@/store/authStore'

type Status = { tone: 'success' | 'error'; text: string } | null
type BooleanNotificationKey = Exclude<keyof NotificationPreferences, 'performance_report_frequency'>

const BOOLEAN_NOTIFICATION_KEYS: BooleanNotificationKey[] = [
  'email_new_message', 'push_new_message', 'email_search_alert', 'push_search_alert',
  'email_boost_activated', 'email_offer_received', 'email_listing_expiring', 'email_listing_expired',
  'email_performance_report', 'push_performance_report',
]

function copyData(data: NotificationPreferencesData): NotificationPreferencesData {
  return {
    notifications: { ...data.notifications },
    bonPlans: {
      ...data.bonPlans,
      notify_categories: [...data.bonPlans.notify_categories],
      notify_businesses: [...data.bonPlans.notify_businesses],
    },
    businesses: [...data.businesses],
  }
}

function samePreferences(left: NotificationPreferencesData | null, right: NotificationPreferencesData | null) {
  if (!left || !right) return true
  return JSON.stringify({ notifications: left.notifications, bonPlans: left.bonPlans })
    === JSON.stringify({ notifications: right.notifications, bonPlans: right.bonPlans })
}

export default function NotificationPreferencesPage() {
  const router = useRouter()
  const { user, demoProfile, hasHydrated } = useAuthStore()
  useAuthSessionSync()

  const [saved, setSaved] = useState<NotificationPreferencesData | null>(null)
  const [draft, setDraft] = useState<NotificationPreferencesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const [businessInput, setBusinessInput] = useState('')
  const [businessError, setBusinessError] = useState('')
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const isPro = Boolean(user?.is_pro)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    setStatus(null)
    try {
      const data = await loadNotificationPreferences({ demoProfile, isPro })
      setSaved(copyData(data))
      setDraft(copyData(data))
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [demoProfile, isPro])

  useEffect(() => {
    if (!hasHydrated) return
    if (!user && !demoProfile) {
      router.replace('/connexion')
      return
    }
    void load()
  }, [demoProfile, hasHydrated, load, router, user])

  useEffect(() => {
    setPushPermission(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
  }, [])

  const dirty = !samePreferences(saved, draft)

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [dirty])

  const updateNotification = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    setStatus(null)
    setDraft((current) => current ? { ...current, notifications: { ...current.notifications, [key]: value } } : current)
  }

  const updateBonPlans = <K extends keyof BonPlanPreferences>(key: K, value: BonPlanPreferences[K]) => {
    setStatus(null)
    setDraft((current) => current ? { ...current, bonPlans: { ...current.bonPlans, [key]: value } } : current)
  }

  const setAllChannels = (enabled: boolean) => {
    setStatus(null)
    setDraft((current) => {
      if (!current) return current
      const notifications = { ...current.notifications }
      BOOLEAN_NOTIFICATION_KEYS.forEach((key) => { notifications[key] = enabled })
      return { ...current, notifications, bonPlans: { ...current.bonPlans, notify_all: enabled, via_email: enabled, via_push: enabled } }
    })
  }

  const toggleCategory = (category: string) => {
    if (!draft) return
    const categories = draft.bonPlans.notify_categories.includes(category)
      ? draft.bonPlans.notify_categories.filter((item) => item !== category)
      : [...draft.bonPlans.notify_categories, category]
    updateBonPlans('notify_categories', categories)
  }

  const addBusiness = () => {
    if (!draft) return
    const name = businessInput.trim()
    if (!name) {
      setBusinessError('Saisissez le nom d’une enseigne.')
      return
    }
    const duplicate = draft.bonPlans.notify_businesses.some((item) => item.localeCompare(name, 'fr', { sensitivity: 'base' }) === 0)
    if (duplicate) {
      setBusinessError('Cette enseigne est déjà suivie.')
      return
    }
    updateBonPlans('notify_businesses', [...draft.bonPlans.notify_businesses, name])
    setBusinessInput('')
    setBusinessError('')
  }

  const removeBusiness = (name: string) => {
    if (draft) updateBonPlans('notify_businesses', draft.bonPlans.notify_businesses.filter((item) => item !== name))
  }

  const handleCancel = () => {
    if (!saved) return
    setDraft(copyData(saved))
    setBusinessInput('')
    setBusinessError('')
    setStatus(null)
  }

  const handleSave = async () => {
    if (!draft || !dirty) return
    setSaving(true)
    setStatus(null)
    try {
      await saveNotificationPreferences(draft, demoProfile)
      setSaved(copyData(draft))
      setStatus({ tone: 'success', text: demoProfile ? 'Préférences démo enregistrées.' : 'Vos préférences ont été enregistrées.' })
    } catch {
      setStatus({ tone: 'error', text: 'Impossible d’enregistrer vos préférences. Réessayez.' })
    } finally {
      setSaving(false)
    }
  }

  const activeCount = useMemo(() => {
    if (!draft) return 0
    return [...BOOLEAN_NOTIFICATION_KEYS.map((key) => draft.notifications[key]), draft.bonPlans.notify_all, draft.bonPlans.via_email, draft.bonPlans.via_push].filter(Boolean).length
  }, [draft])

  const pushSelected = Boolean(draft && (
    draft.notifications.push_new_message || draft.notifications.push_search_alert
    || draft.notifications.push_performance_report || draft.bonPlans.via_push
  ))

  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen bg-cream"><Header />
        <main className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6">
          <div className="skeleton h-14 max-w-xl rounded-control" />
          <div className="mt-10 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="skeleton h-80 rounded-card" />
            <div className="space-y-5"><div className="skeleton h-72 rounded-card" /><div className="skeleton h-72 rounded-card" /></div>
          </div>
        </main>
      </div>
    )
  }

  if (loadError || !draft) {
    return (
      <div className="min-h-screen bg-cream"><Header />
        <main className="mx-auto flex max-w-[760px] flex-col items-center px-4 py-20 text-center">
          <AlertCircle className="h-10 w-10 text-alert-error" aria-hidden="true" />
          <h1 className="mt-5 font-display text-title-lg text-ink">Préférences indisponibles</h1>
          <p className="mt-2 text-body text-ink/65">Nous n’avons pas pu charger vos préférences de notifications.</p>
          <Button className="mt-6" onClick={() => void load()}>Réessayer</Button>
        </main>
      </div>
    )
  }

  const navItems = [
    { href: '#messages', label: 'Messages', count: 2 },
    { href: '#alertes', label: 'Alertes d’offres', count: 2 },
    { href: '#annonces', label: 'Mes annonces', count: 4 },
    { href: '#rapports', label: 'Rapports', count: 3 },
    { href: '#bons-plans', label: 'Bons Plans', count: 3 },
  ]

  return (
    <div className="min-h-screen bg-cream pb-32"><Header />
      <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-6 border-b border-sand pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-label-sm font-semibold uppercase tracking-[0.18em] text-papaya">Mon compte · Paramètres</p>
            <h1 className="mt-3 max-w-3xl font-display text-display-sm text-ink">Préférences de notifications</h1>
            <p className="mt-3 max-w-2xl text-body text-ink/65">Choisissez les informations que vous souhaitez recevoir et le canal qui vous convient.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" compact onClick={() => setAllChannels(true)}>Tout activer</Button>
            <Button variant="ghost" compact onClick={() => setAllChannels(false)}>Tout désactiver</Button>
          </div>
        </div>

        {pushSelected && pushPermission !== 'granted' && (
          <div className="mt-6 flex items-start gap-3 rounded-control border border-alert-warning/30 bg-alert-warning/10 px-4 py-3 text-body-sm text-ink" role="status">
            <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-alert-warning" aria-hidden="true" />
            <p><strong>Notifications push non autorisées.</strong> Activez-les dans les réglages de votre navigateur pour recevoir les alertes choisies.</p>
          </div>
        )}

        <div className="mt-8 grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
          <PreferencesNav items={navItems} activeCount={activeCount} />
          <div className="space-y-6">
            <PreferencesSection id="messages" title="Messages" description="Soyez averti dès qu’un membre vous écrit au sujet d’une annonce." icon={MessageCircle} count={2}>
              <ChannelHeadings />
              <PreferenceRow title="Nouveau message" description="Une nouvelle réponse ou conversation dans votre messagerie." email={draft.notifications.email_new_message} push={draft.notifications.push_new_message} onEmailChange={(value) => updateNotification('email_new_message', value)} onPushChange={(value) => updateNotification('push_new_message', value)} />
            </PreferencesSection>

            <PreferencesSection id="alertes" title="Alertes d’offres" description="Recevez les nouvelles annonces qui correspondent à vos recherches sauvegardées." icon={Search} count={2}>
              <ChannelHeadings />
              <PreferenceRow title="Nouvelle annonce correspondante" description="Une annonce répond aux critères d’une de vos alertes." email={draft.notifications.email_search_alert} push={draft.notifications.push_search_alert} onEmailChange={(value) => updateNotification('email_search_alert', value)} onPushChange={(value) => updateNotification('push_search_alert', value)} />
            </PreferencesSection>

            <PreferencesSection id="annonces" title="Mes annonces" description="Suivez les événements importants liés aux annonces que vous publiez." icon={Tag} count={4}>
              <ChannelHeadings />
              <PreferenceRow title="Boost activé" description="Votre mise en avant vient d’être activée." email={draft.notifications.email_boost_activated} onEmailChange={(value) => updateNotification('email_boost_activated', value)} />
              <PreferenceRow title="Nouvelle offre reçue" description="Un membre vous propose un prix dans la messagerie." email={draft.notifications.email_offer_received} onEmailChange={(value) => updateNotification('email_offer_received', value)} />
              <PreferenceRow title="Annonce bientôt expirée" description="Un rappel trois jours avant la fin de publication." email={draft.notifications.email_listing_expiring} onEmailChange={(value) => updateNotification('email_listing_expiring', value)} />
              <PreferenceRow title="Annonce expirée" description="Votre annonce n’est désormais plus visible en ligne." email={draft.notifications.email_listing_expired} onEmailChange={(value) => updateNotification('email_listing_expired', value)} />
            </PreferencesSection>

            <PreferencesSection id="rapports" title="Rapports de performance" description="Recevez un résumé des vues, clics et favoris de vos annonces." icon={BarChart3} count={3}>
              <ChannelHeadings />
              <PreferenceRow title="Rapport disponible" description="Votre nouveau rapport de performance est prêt." email={draft.notifications.email_performance_report} push={draft.notifications.push_performance_report} onEmailChange={(value) => updateNotification('email_performance_report', value)} onPushChange={(value) => updateNotification('push_performance_report', value)} />
              <div className="px-5 py-5 sm:px-7">
                <SegmentedControl label="Fréquence du rapport" value={draft.notifications.performance_report_frequency} onChange={(value) => updateNotification('performance_report_frequency', value as NotificationPreferences['performance_report_frequency'])} options={isPro ? [
                  { value: 'daily', label: 'Quotidien' }, { value: 'weekly', label: 'Hebdomadaire' },
                  { value: 'monthly', label: 'Mensuel' }, { value: 'never', label: 'Jamais' },
                ] : [{ value: 'weekly', label: 'Hebdomadaire' }, { value: 'never', label: 'Jamais' }]} />
                {!isPro && <p className="mt-2 text-meta text-ink/55">Les fréquences quotidienne et mensuelle sont disponibles avec un compte Pro.</p>}
              </div>
            </PreferencesSection>

            <PreferencesSection id="bons-plans" title="Bons Plans et promotions" description="Suivez toutes les promotions ou seulement les catégories et enseignes qui vous intéressent." icon={Store} count={3}>
              <div className="space-y-6 px-5 py-6 sm:px-7">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Switch label="Toutes les nouvelles promotions" checked={draft.bonPlans.notify_all} onChange={(event) => updateBonPlans('notify_all', event.target.checked)} />
                  <Switch label="Par email" checked={draft.bonPlans.via_email} onChange={(event) => updateBonPlans('via_email', event.target.checked)} />
                  <Switch label="En push" checked={draft.bonPlans.via_push} onChange={(event) => updateBonPlans('via_push', event.target.checked)} />
                </div>
                <div className="border-t border-sand pt-6">
                  <h3 className="text-body-sm font-semibold text-ink">Catégories favorites</h3>
                  <p className="mt-1 text-body-sm text-ink/60">Sélectionnez les familles de promotions qui vous intéressent.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {BON_PLAN_CATEGORIES.map((category) => <FilterChip key={category.value} selected={draft.bonPlans.notify_categories.includes(category.value)} onClick={() => toggleCategory(category.value)}>{category.label}</FilterChip>)}
                  </div>
                </div>
                <div className="border-t border-sand pt-6">
                  <h3 className="text-body-sm font-semibold text-ink">Enseignes suivies</h3>
                  <p className="mt-1 text-body-sm text-ink/60">Ajoutez les commerces dont vous ne voulez manquer aucune promotion.</p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <Input label="Nom de l’enseigne" list="bon-plan-businesses" value={businessInput} error={businessError} placeholder="Rechercher une enseigne" onChange={(event) => { setBusinessInput(event.target.value); setBusinessError('') }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addBusiness() } }} />
                      <datalist id="bon-plan-businesses">{draft.businesses.map((business) => <option key={business.name} value={business.name} />)}</datalist>
                    </div>
                    <Button className="sm:mt-7" variant="secondary" onClick={addBusiness}>Ajouter</Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {draft.bonPlans.notify_businesses.length === 0 ? <p className="text-body-sm text-ink/50">Aucune enseigne suivie pour le moment.</p> : draft.bonPlans.notify_businesses.map((business) => (
                      <span key={business} className="inline-flex items-center gap-2 rounded-full border border-sand bg-cream-sunken px-3 py-1.5 text-body-sm font-semibold text-ink/70">
                        {business}<button type="button" className="rounded-full text-ink/45 hover:text-alert-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-papaya" onClick={() => removeBusiness(business)} aria-label={`Retirer ${business}`}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </PreferencesSection>

            <section className="rounded-card bg-petrol px-6 py-7 text-white sm:px-8" aria-labelledby="privacy-title">
              <div className="flex items-start gap-4"><ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-papaya" aria-hidden="true" />
                <div><h2 id="privacy-title" className="font-display text-title-sm">Confidentialité et désabonnement</h2>
                  <p className="mt-2 max-w-2xl text-body-sm text-white/70">Chaque email contient un lien permettant de désactiver la catégorie concernée. Vous pouvez aussi revenir modifier vos choix ici à tout moment.</p>
                  <div className="mt-5 flex flex-wrap gap-4 text-body-sm font-semibold">
                    <SafeLink href="/politique-de-confidentialite" dirty={dirty} className="text-papaya hover:underline">Politique de confidentialité</SafeLink>
                    <SafeLink href="/parametres" dirty={dirty} className="text-white hover:underline">Retour aux paramètres</SafeLink>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <SaveBar dirty={dirty} saving={saving} status={status} onCancel={handleCancel} onSave={() => void handleSave()} />
    </div>
  )
}
