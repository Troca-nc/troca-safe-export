'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, BellOff, Clock3, Mail, MapPin, Pause, Play, RefreshCw, Trash2 } from 'lucide-react'

import { alertsApi } from '@/lib/api'
import { DEMO } from '@/lib/demo'
import { getAlertRecentResults, getPersonalAlerts } from '@/lib/data/personal-account'
import { showDemoToast } from '@/lib/demoMode'
import { FREQUENCY_OPTIONS } from '@/types/alert.types'
import type { AccountSession } from '@/types/account'
import type { AlertFrequency, SearchAlert } from '@/types/alert.types'
import type { AlertRecentResult } from '@/types/personal-account'

const formatXpf = (value: number | null) => value == null ? 'Prix à débattre' : value === 0 ? 'Gratuit' : `${value.toLocaleString('fr-FR')} XPF`

function getErrorMessage(error: unknown) {
  const response = error as { response?: { data?: { error?: string } } }
  return response?.response?.data?.error || 'Impossible de charger les alertes.'
}

export default function PersonalAlertsManager({ session }: { session: AccountSession }) {
  const demo = DEMO || String(session.id).startsWith('demo-')
  const [alerts, setAlerts] = useState<SearchAlert[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [results, setResults] = useState<AlertRecentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultsError, setResultsError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await getPersonalAlerts(session)
      setAlerts(next)
      setSelectedId((current) => current && next.some((item) => item.id === current) ? current : next[0]?.id ?? null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { void load() }, [load])
  const selected = useMemo(() => alerts.find((alert) => alert.id === selectedId) ?? alerts[0] ?? null, [alerts, selectedId])

  const loadResults = useCallback(async () => {
    if (!selected) {
      setResults([])
      return
    }
    setResultsLoading(true)
    setResultsError(null)
    try {
      setResults(await getAlertRecentResults(session, selected))
    } catch (err) {
      setResultsError(getErrorMessage(err))
      setResults([])
    } finally {
      setResultsLoading(false)
    }
  }, [selected, session])

  useEffect(() => { void loadResults() }, [loadResults])

  const update = async (alert: SearchAlert, patch: Partial<SearchAlert>, success: string) => {
    const previous = alerts
    setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, ...patch } : item))
    setBusyId(alert.id)
    setFeedback(success)
    if (demo) {
      showDemoToast('Action simulée en mode démo')
      setBusyId(null)
      return
    }
    try {
      await alertsApi.update(alert.id, patch)
    } catch (err) {
      setAlerts(previous)
      setFeedback(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (alert: SearchAlert) => {
    if (!window.confirm(`Supprimer l’alerte « ${alert.label} » ?`)) return
    const previous = alerts
    setAlerts((current) => current.filter((item) => item.id !== alert.id))
    setFeedback('Alerte supprimée.')
    setBusyId(alert.id)
    if (demo) {
      showDemoToast('Action simulée en mode démo')
      setBusyId(null)
      return
    }
    try {
      await alertsApi.delete(alert.id)
    } catch (err) {
      setAlerts(previous)
      setFeedback(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="skeleton h-28 rounded-[1.5rem]" />)}</div>
  if (error) return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800"><p>{error}</p><button onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-full bg-cream-surface px-4 py-2 font-semibold"><RefreshCw className="h-4 w-4" /> Réessayer</button></div>

  if (alerts.length === 0) {
    return <div className="rounded-[2rem] border border-dashed border-warm-border bg-surface p-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent"><Bell className="h-6 w-6" /></div><h2 className="mt-4 font-display text-2xl font-bold text-ink">Aucune alerte</h2><p className="mx-auto mt-2 max-w-lg text-sm text-ink/60">Sauvegardez une recherche pour recevoir les nouvelles annonces correspondantes.</p><Link href="/annonces" className="btn-primary mt-5 inline-flex rounded-full px-5 py-2.5">Parcourir les annonces</Link></div>
  }

  return (
    <div>
      {feedback ? <div role="status" className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{feedback}</div> : null}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="space-y-3" aria-label="Liste des alertes">
          {alerts.map((alert) => {
            const active = alert.status === 'active'
            const selectedAlert = selected?.id === alert.id
            return (
              <article key={alert.id} className={`rounded-[1.5rem] border bg-surface p-4 shadow-sm transition ${selectedAlert ? 'border-ink ring-2 ring-ink/5' : 'border-warm-border'} ${active ? '' : 'opacity-65'}`}>
                <button type="button" onClick={() => setSelectedId(alert.id)} className="w-full text-left">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-accent text-ink' : 'bg-sand text-ink/35'}`}>{active ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}</div>
                    <div className="min-w-0"><h2 className="truncate font-semibold text-ink">{alert.label}</h2><div className="mt-1 flex flex-wrap gap-1.5">{Object.values(alert.filters).filter((value) => value != null && value !== '').slice(0, 3).map((value, index) => <span key={`${String(value)}-${index}`} className="rounded-full bg-sand px-2 py-0.5 text-caption text-ink/60">{String(value)}</span>)}</div><p className="mt-2 text-xs text-ink/45">{alert.nb_results} résultat{alert.nb_results > 1 ? 's' : ''}</p></div>
                  </div>
                </button>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-warm-border pt-3">
                  <select value={alert.frequency} onChange={(event) => void update(alert, { frequency: event.target.value as AlertFrequency }, 'Fréquence mise à jour.')} className="min-h-10 rounded-xl border border-warm-border bg-cream-surface px-3 text-xs font-semibold text-ink" aria-label={`Fréquence de ${alert.label}`}>{FREQUENCY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-sand px-3 text-xs font-semibold text-ink/65"><Mail className="h-3.5 w-3.5" /> E-mail</span>
                  <button disabled={busyId === alert.id} onClick={() => void update(alert, { status: active ? 'paused' : 'active' }, active ? 'Alerte mise en pause.' : 'Alerte réactivée.')} className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl border border-warm-border text-ink/60" title={active ? 'Mettre en pause' : 'Réactiver'}>{active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
                  <button disabled={busyId === alert.id} onClick={() => void remove(alert)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-600" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>
            )
          })}
        </section>

        <section className="rounded-[2rem] border border-warm-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-rust">Résultats récents</p><h2 className="mt-1 font-display text-2xl font-bold text-ink">{selected?.label}</h2></div>
            {selected ? <Link href={`/annonces?${new URLSearchParams(Object.entries(selected.filters).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)])).toString()}`} className="text-sm font-semibold text-rust">Voir tous les résultats</Link> : null}
          </div>
          {resultsLoading ? <div className="mt-5 space-y-3">{[0, 1, 2].map((item) => <div key={item} className="skeleton h-20 rounded-2xl" />)}</div> : resultsError ? <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700"><p>{resultsError}</p><button onClick={() => void loadResults()} className="mt-2 font-semibold underline">Réessayer</button></div> : results.length === 0 ? <div className="mt-8 text-center"><BellOff className="mx-auto h-8 w-8 text-ink/20" /><p className="mt-3 text-sm text-ink/55">Aucun résultat récent pour cette alerte.</p></div> : (
            <div className="mt-5 space-y-3">{results.map((result) => <Link key={result.id} href={`/annonces/${result.id}`} className="flex gap-3 rounded-2xl border border-warm-border p-3 transition hover:border-rust/40"><div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sand text-ink/25">{result.coverImage ? <img src={result.coverImage} alt="" className="h-full w-full object-cover" /> : <Bell className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><p className="line-clamp-2 font-semibold text-ink">{result.title}</p><p className="mt-1 text-sm font-bold text-rust">{formatXpf(result.price)}</p><p className="mt-1 inline-flex items-center gap-1 text-xs text-ink/45"><MapPin className="h-3 w-3" /> {result.communeName || 'Nouvelle-Calédonie'}{result.publishedAt ? <><Clock3 className="ml-2 h-3 w-3" /> {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(result.publishedAt))}</> : null}</p></div></Link>)}</div>
          )}
        </section>
      </div>
    </div>
  )
}
