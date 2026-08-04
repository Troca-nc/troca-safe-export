'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Check, Loader2, MapPin, Plus, Ticket } from 'lucide-react'

import Header from '@/components/layout/Header'
import { eventsApi, metaApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

type CommuneOption = { id: number; name: string }

type TicketTypeForm = {
  name: string
  description: string
  price_xpf: string
  quantity_total: string
}

const INITIAL_TICKET: TicketTypeForm = {
  name: 'Standard',
  description: '',
  price_xpf: '0',
  quantity_total: '100',
}

export default function EventPublishPage() {
  const { isAuthenticated } = useAuthStore()
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [communes, setCommunes] = useState<CommuneOption[]>([])
  const [loadingCommunes, setLoadingCommunes] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [ticketing, setTicketing] = useState(true)
  const [isFree, setIsFree] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    venue_name: '',
    venue_address: '',
    commune_id: '',
    event_date: '',
    event_time: '19:00',
    end_time: '',
    cover_image_url: '',
    category: 'concert',
    organizer_name: '',
    organizer_email: '',
    organizer_phone: '',
    website_url: '',
    max_capacity: '100',
  })
  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([
    INITIAL_TICKET,
  ])

  useEffect(() => {
    let alive = true
    setLoadingCommunes(true)
    metaApi.getCommunes()
      .then((response) => {
        if (!alive) return
        const list = Array.isArray(response.data?.data) ? response.data.data : []
        setCommunes(list.map((item: any) => ({ id: Number(item.id), name: item.name || item.nom || item.libelle || `Commune ${item.id}` })))
      })
      .catch(() => {
        if (!alive) return
        setCommunes([])
      })
      .finally(() => {
        if (alive) setLoadingCommunes(false)
      })

    return () => {
      alive = false
    }
  }, [])

  if (!hasHydrated) {
    return (
      <main className="min-h-screen bg-sand-light text-night">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="h-72 animate-pulse rounded-[2rem] bg-white" />
        </div>
      </main>
    )
  }

  const updateField = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
    setSuccess('')
  }

  const updateTicketType = (index: number, key: keyof TicketTypeForm, value: string) => {
    setTicketTypes((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)))
    setError('')
    setSuccess('')
  }

  const addTicketType = () => {
    setTicketTypes((current) => [...current, { ...INITIAL_TICKET, name: `Billet ${current.length + 1}` }])
  }

  const removeTicketType = (index: number) => {
    setTicketTypes((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!isAuthenticated) {
      openAuthModal({
        type: 'publish_listing',
        redirectTo: '/evenements/publier',
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        venue_name: form.venue_name.trim() || null,
        venue_address: form.venue_address.trim() || null,
        commune_id: form.commune_id ? Number(form.commune_id) : null,
        event_date: form.event_date,
        event_time: form.event_time,
        end_time: form.end_time || null,
        cover_image_url: form.cover_image_url.trim() || null,
        photos: form.cover_image_url ? [form.cover_image_url.trim()] : [],
        category: form.category,
        status: 'published',
        has_ticketing: ticketing,
        max_capacity: form.max_capacity ? Number(form.max_capacity) : null,
        is_free: isFree,
        organizer_name: form.organizer_name.trim() || null,
        organizer_email: form.organizer_email.trim() || null,
        organizer_phone: form.organizer_phone.trim() || null,
        website_url: form.website_url.trim() || null,
        target_audience: 'particulier',
        kind: form.category === 'concert' ? 'concert' : 'event',
        price_xpf: isFree ? 0 : 0,
        ticket_types: ticketing
          ? ticketTypes
              .filter((ticket) => ticket.name.trim())
              .map((ticket, index) => ({
                name: ticket.name.trim(),
                description: ticket.description.trim() || null,
                price_xpf: isFree ? 0 : Number(ticket.price_xpf || 0),
                quantity_total: Number(ticket.quantity_total || 0),
                is_active: true,
                position: index,
              }))
          : [],
      }

      const { data } = await eventsApi.create(payload)
      const eventId = data?.data?.id
      if (eventId) {
        window.location.assign(`/evenements/${eventId}`)
        return
      }
      setSuccess('ï¿½vï¿½nement publiï¿½ avec succï¿½s.')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de publier lï¿½vï¿½nement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-sand-light text-night">
      <Header />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="overflow-hidden rounded-[2rem] border border-night/8 bg-white shadow-sm">
          <div className="bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white md:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-lagoon">Billetterie native</p>
            <h1 className="mt-3 font-display text-4xl font-bold">Publier un ï¿½vï¿½nement avec billets</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/72 md:text-base">
              Crï¿½ez un ï¿½vï¿½nement, dï¿½finissez vos billets, puis gï¿½rez la rï¿½servation et le scan depuis Kalico.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 p-6 md:grid-cols-[1.05fr_0.95fr] md:p-8">
            <div className="space-y-6">
              {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
              {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

              <section className="rounded-[1.5rem] border border-night/8 bg-sand/40 p-5">
                <div className="mb-4 flex items-center gap-2 text-night">
                  <CalendarDays className="h-4 w-4 text-coral" />
                  <h2 className="text-lg font-bold">Informations ï¿½vï¿½nement</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-semibold">Titre</span>
                    <input value={form.title} onChange={(e) => updateField('title', e.target.value)} required className="input w-full" />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-semibold">Description</span>
                    <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={4} required className="input w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Lieu</span>
                    <input value={form.venue_name} onChange={(e) => updateField('venue_name', e.target.value)} className="input w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Adresse</span>
                    <input value={form.venue_address} onChange={(e) => updateField('venue_address', e.target.value)} className="input w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Commune</span>
                    <select value={form.commune_id} onChange={(e) => updateField('commune_id', e.target.value)} className="input w-full">
                      <option value="">Choisir une commune</option>
                      {loadingCommunes ? <option>Chargement...</option> : null}
                      {communes.map((commune) => (
                        <option key={commune.id} value={commune.id}>{commune.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">CatÃ©gorie</span>
                    <select value={form.category} onChange={(e) => updateField('category', e.target.value)} className="input w-full">
                      <option value="concert">Concert</option>
                      <option value="festival">Festival</option>
                      <option value="sport">Sport</option>
                      <option value="marche">Marche</option>
                      <option value="conference">Confï¿½rence</option>
                      <option value="exposition">Exposition</option>
                      <option value="cinema">Cinï¿½ma</option>
                      <option value="spectacle">Spectacle</option>
                      <option value="autre">Autre</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Date</span>
                    <input type="date" value={form.event_date} onChange={(e) => updateField('event_date', e.target.value)} required className="input w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Heure</span>
                    <input type="time" value={form.event_time} onChange={(e) => updateField('event_time', e.target.value)} required className="input w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Fin</span>
                    <input type="time" value={form.end_time} onChange={(e) => updateField('end_time', e.target.value)} className="input w-full" />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-semibold">Image de couverture (URL)</span>
                    <input value={form.cover_image_url} onChange={(e) => updateField('cover_image_url', e.target.value)} placeholder="https://..." className="input w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Organisateur</span>
                    <input value={form.organizer_name} onChange={(e) => updateField('organizer_name', e.target.value)} className="input w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Email organisateur</span>
                    <input value={form.organizer_email} onChange={(e) => updateField('organizer_email', e.target.value)} type="email" className="input w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Tï¿½lï¿½phone organisateur</span>
                    <input value={form.organizer_phone} onChange={(e) => updateField('organizer_phone', e.target.value)} className="input w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Site web</span>
                    <input value={form.website_url} onChange={(e) => updateField('website_url', e.target.value)} placeholder="https://..." className="input w-full" />
                  </label>
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-night/8 bg-sand/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-night">
                      <Ticket className="h-4 w-4 text-coral" />
                      <h2 className="text-lg font-bold">Billetterie</h2>
                    </div>
                    <p className="text-sm text-night/60">Ajoutez un ou plusieurs types de billets et activez la rï¿½servation native.</p>
                  </div>
                  <button type="button" onClick={addTicketType} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-night">
                    <Plus className="h-4 w-4" />
                    Ajouter un billet
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setTicketing(true)} className={`rounded-full px-4 py-2 text-sm font-semibold ${ticketing ? 'bg-[#0A7EA4] text-white' : 'bg-white text-night'}`}>
                    Billetterie activï¿½e
                  </button>
                  <button type="button" onClick={() => setIsFree((value) => !value)} className={`rounded-full px-4 py-2 text-sm font-semibold ${isFree ? 'bg-emerald-600 text-white' : 'bg-white text-night'}`}>
                    {isFree ? 'ï¿½vï¿½nement gratuit' : 'ï¿½vï¿½nement payant'}
                  </button>
                </div>

                <div className="mt-4 grid gap-4">
                  <label className="space-y-1 md:max-w-xs">
                    <span className="text-sm font-semibold">Capacitï¿½ totale</span>
                    <input value={form.max_capacity} onChange={(e) => updateField('max_capacity', e.target.value)} type="number" min="1" className="input w-full" />
                  </label>

                  {ticketTypes.map((ticket, index) => (
                    <div key={`${ticket.name}-${index}`} className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-night">Billet {index + 1}</h3>
                        {ticketTypes.length > 1 ? (
                          <button type="button" onClick={() => removeTicketType(index)} className="text-sm font-semibold text-red-600">
                            Supprimer
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <label className="space-y-1">
                          <span className="text-sm font-semibold">Nom</span>
                          <input value={ticket.name} onChange={(e) => updateTicketType(index, 'name', e.target.value)} className="input w-full" />
                        </label>
                        <label className="space-y-1">
                          <span className="text-sm font-semibold">Prix XPF</span>
                          <input value={ticket.price_xpf} onChange={(e) => updateTicketType(index, 'price_xpf', e.target.value)} type="number" min="0" step="10" className="input w-full" />
                        </label>
                        <label className="space-y-1 md:col-span-2">
                          <span className="text-sm font-semibold">Description</span>
                          <input value={ticket.description} onChange={(e) => updateTicketType(index, 'description', e.target.value)} className="input w-full" />
                        </label>
                        <label className="space-y-1">
                          <span className="text-sm font-semibold">Quantitï¿½ totale</span>
                          <input value={ticket.quantity_total} onChange={(e) => updateTicketType(index, 'quantity_total', e.target.value)} type="number" min="1" className="input w-full" />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Publier lï¿½vï¿½nement
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[1.5rem] border border-coral/15 bg-coral/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">Aperï¿½u</p>
                <div className="mt-3 rounded-[1.25rem] border border-night/8 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">{form.category}</p>
                  <h3 className="mt-2 text-xl font-bold text-night">{form.title || 'Titre de lï¿½vï¿½nement'}</h3>
                  <p className="mt-2 text-sm text-night/65">{form.description || 'La description de lï¿½vï¿½nement apparaï¿½tra ici.'}</p>
                  <div className="mt-4 space-y-2 text-sm text-night/60">
                    <p className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-coral" />
                      {form.venue_name || 'Lieu ï¿½ dï¿½finir'}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-coral" />
                      {form.event_date || 'Date ï¿½ dï¿½finir'} ï¿½ {form.event_time}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-night/8 bg-sand/40 p-5">
                <h3 className="text-lg font-bold text-night">Checklist</h3>
                <ul className="mt-3 space-y-2 text-sm text-night/65">
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-coral" /> Publication sur Kalico</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-coral" /> Rï¿½servation native 10 minutes</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-coral" /> QR code de contrï¿½le gï¿½nï¿½rï¿½ automatiquement</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-coral" /> Scan depuis `/scan/[token]`</li>
                </ul>
              </div>

              <div className="rounded-[1.5rem] border border-night/8 bg-white p-5 text-sm text-night/60">
                <p className="font-semibold text-night">Besoin daide ?</p>
                <p className="mt-2">
                  Vous pouvez dabord publier un ï¿½vï¿½nement gratuit pour tester le flux, puis activer des billets payants une fois prï¿½t.
                </p>
                <Link href="/evenements" className="mt-4 inline-flex items-center gap-2 font-semibold text-coral">
                  Retour au calendrier
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </form>
        </div>
      </section>
    </main>
  )
}
