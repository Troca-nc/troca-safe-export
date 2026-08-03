'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BellRing, Plus, Trash2 } from 'lucide-react'

import { covoitAlertsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const DAYS = [
  { value: '', label: "N'importe quel jour" },
  { value: '0', label: 'Lundi' },
  { value: '1', label: 'Mardi' },
  { value: '2', label: 'Mercredi' },
  { value: '3', label: 'Jeudi' },
  { value: '4', label: 'Vendredi' },
  { value: '5', label: 'Samedi' },
  { value: '6', label: 'Dimanche' },
]

type AlertItem = {
  id: number
  from_commune: string | null
  to_commune: string | null
  jour_semaine: number | null
  heure_min: string | null
  heure_max: string | null
  via_push: boolean
  via_email: boolean
  active: boolean
}

export default function AlertesTrajetPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [items, setItems] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fromCommune, setFromCommune] = useState('')
  const [toCommune, setToCommune] = useState('')
  const [jourSemaine, setJourSemaine] = useState('')
  const [heureMin, setHeureMin] = useState('')
  const [heureMax, setHeureMax] = useState('')
  const [viaPush, setViaPush] = useState(true)
  const [viaEmail, setViaEmail] = useState(false)

  useEffect(() => {
    if (!hasHydrated) return
    if (!user) router.replace('/connexion')
  }, [hasHydrated, router, user])

  useEffect(() => {
    let alive = true
    covoitAlertsApi.list()
      .then(({ data }) => {
        if (!alive) return
        setItems(Array.isArray(data.data) ? data.data : [])
      })
      .catch(() => {
        if (!alive) return
        setItems([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const activeCount = useMemo(() => items.filter((item) => item.active).length, [items])

  const createAlert = async () => {
    if (activeCount >= 3) return
    setSaving(true)
    try {
      const { data } = await covoitAlertsApi.create({
        from_commune: fromCommune.trim() || null,
        to_commune: toCommune.trim() || null,
        jour_semaine: jourSemaine === '' ? null : Number(jourSemaine),
        heure_min: heureMin.trim() || null,
        heure_max: heureMax.trim() || null,
        via_push: viaPush,
        via_email: viaEmail,
        active: true,
      })
      const created = data?.data
      if (created) setItems((current) => [created, ...current])
      setFromCommune('')
      setToCommune('')
      setJourSemaine('')
      setHeureMin('')
      setHeureMax('')
      setViaPush(true)
      setViaEmail(false)
    } finally {
      setSaving(false)
    }
  }

  const toggleAlert = async (item: AlertItem) => {
    const nextActive = !item.active
    await covoitAlertsApi.update(item.id, { active: nextActive })
    setItems((current) => current.map((alert) => (alert.id === item.id ? { ...alert, active: nextActive } : alert)))
  }

  const deleteAlert = async (item: AlertItem) => {
    await covoitAlertsApi.delete(item.id)
    setItems((current) => current.filter((alert) => alert.id !== item.id))
  }

  if (!hasHydrated) {
    return (
      <main className="min-h-screen bg-sand-light px-4 py-8 text-night">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-night/8 bg-white p-8 shadow-sm animate-pulse">
            <div className="skeleton h-6 w-40 rounded-full" />
            <div className="mt-4 space-y-3">
              <div className="skeleton h-10 rounded-2xl" />
              <div className="skeleton h-10 rounded-2xl" />
              <div className="skeleton h-10 rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-sand-light px-4 py-8 text-night">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-coral/15 bg-coral/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-coral">
            <BellRing className="h-3.5 w-3.5" />
            Alertes trajet
          </div>
          <h1 className="mt-3 text-3xl font-bold">Mes alertes covoiturage</h1>
          <p className="mt-2 text-sm text-night/60">
            Recevez une notification d�s qu'un trajet publi� correspond � vos habitudes.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <input value={fromCommune} onChange={(e) => setFromCommune(e.target.value)} placeholder="D�part" className="input" />
            <input value={toCommune} onChange={(e) => setToCommune(e.target.value)} placeholder="Arriv�e" className="input" />
            <select value={jourSemaine} onChange={(e) => setJourSemaine(e.target.value)} className="input md:col-span-2">
              {DAYS.map((day) => (
                <option key={day.value || 'any'} value={day.value}>{day.label}</option>
              ))}
            </select>
            <input value={heureMin} onChange={(e) => setHeureMin(e.target.value)} placeholder="Heure min (HH:MM)" className="input" />
            <input value={heureMax} onChange={(e) => setHeureMax(e.target.value)} placeholder="Heure max (HH:MM)" className="input" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-night/70">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={viaPush} onChange={(e) => setViaPush(e.target.checked)} />
              Push
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={viaEmail} onChange={(e) => setViaEmail(e.target.checked)} />
              Email
            </label>
          </div>

          <button
            type="button"
            onClick={createAlert}
            disabled={saving || activeCount >= 3}
            className="btn-primary mt-5 inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Cr�er l'alerte
          </button>
          <p className="mt-2 text-xs text-night/45">Limite: 3 alertes actives par utilisateur.</p>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="rounded-[1.5rem] border border-night/8 bg-white p-8 text-center text-sm text-night/50">Chargement...</div>
          ) : items.length > 0 ? items.map((item) => (
            <article key={item.id} className="rounded-[1.5rem] border border-night/8 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {item.from_commune || 'Tous d�parts'} � {item.to_commune || 'Toutes destinations'}
                  </h2>
                  <p className="mt-1 text-sm text-night/55">
                    {item.jour_semaine == null ? "N'importe quel jour" : DAYS.find((day) => Number(day.value) === item.jour_semaine)?.label}
                    {item.heure_min ? ` � ${item.heure_min}` : ''}
                    {item.heure_max ? ` - ${item.heure_max}` : ''}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-night/70">
                  Actif
                  <input type="checkbox" checked={item.active} onChange={() => toggleAlert(item)} />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => deleteAlert(item)} className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </article>
          )) : (
            <div className="rounded-[1.5rem] border border-night/8 bg-white p-8 text-center text-sm text-night/50">
              Aucune alerte trajet pour le moment.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
