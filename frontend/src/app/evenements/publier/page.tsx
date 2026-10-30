'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Image as ImageIcon, Plus } from 'lucide-react'

import { EventFormSection } from '@/components/events/EventFormSection'
import { EventPreviewCard } from '@/components/events/EventPreviewCard'
import { PublishChecklist, type PublishCheck } from '@/components/events/PublishChecklist'
import { PublishPanel } from '@/components/events/PublishPanel'
import { TicketTypeCard, type TicketErrors } from '@/components/events/TicketTypeCard'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { FilterChip, Switch } from '@/components/ui/Controls'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { clearLocalEventDraft, createEventPublishDraft, EVENT_CATEGORIES, getEventPublishMetadata, INITIAL_EVENT_TICKET, loadLocalEventDraft, publishEvent, saveLocalEventDraft } from '@/lib/data/events'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'
import type { EventPublishDraft, EventTicketDraft } from '@/types/events'

type FieldErrors = Partial<Record<keyof EventPublishDraft, string>>
const NEW_TICKET: EventTicketDraft = { name: '', description: '', priceXpf: '0', quantity: '50' }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validUrl(value: string) {
  if (!value.trim()) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch { return false }
}

function snapshot(form: EventPublishDraft, ticketing: boolean, tickets: EventTicketDraft[]) {
  return JSON.stringify({ form, ticketing, tickets })
}

export default function EventPublishPage() {
  const { isAuthenticated, user, hasHydrated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [form, setForm] = useState<EventPublishDraft>(() => createEventPublishDraft())
  const [ticketing, setTicketing] = useState(true)
  const [tickets, setTickets] = useState<EventTicketDraft[]>([{ ...INITIAL_EVENT_TICKET }])
  const [communes, setCommunes] = useState<{ id: number; name: string }[]>([])
  const [initialized, setInitialized] = useState(false)
  const [metadataLoading, setMetadataLoading] = useState(true)
  const [metadataError, setMetadataError] = useState('')
  const [metadataAttempt, setMetadataAttempt] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [ticketErrors, setTicketErrors] = useState<TicketErrors[]>([])
  const [publishing, setPublishing] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')
  const cleanSnapshot = useRef('')
  const titleRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const venueRef = useRef<HTMLInputElement>(null)
  const organizerRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const firstTicketRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!hasHydrated || initialized) return
    const profile = { name: [user?.first_name || user?.prenom, user?.last_name || user?.nom].filter(Boolean).join(' '), email: user?.email, phone: user?.telephone || '' }
    const stored = loadLocalEventDraft(user?.id)
    let initialForm = stored?.form || createEventPublishDraft(profile)
    const category = new URLSearchParams(window.location.search).get('category')
    if (!stored && EVENT_CATEGORIES.some((option) => option.value === category)) initialForm = { ...initialForm, category: category as EventPublishDraft['category'] }
    const initialTicketing = stored?.ticketing ?? true
    const initialTickets = stored?.tickets?.length ? stored.tickets : [{ ...INITIAL_EVENT_TICKET }]
    setForm(initialForm); setTicketing(initialTicketing); setTickets(initialTickets)
    cleanSnapshot.current = snapshot(initialForm, initialTicketing, initialTickets)
    setInitialized(true)
  }, [hasHydrated, initialized, user])

  useEffect(() => {
    let active = true
    setMetadataLoading(true); setMetadataError('')
    getEventPublishMetadata()
      .then((metadata) => { if (active) setCommunes(metadata.communes) })
      .catch(() => { if (active) setMetadataError('Impossible de charger les communes.') })
      .finally(() => { if (active) setMetadataLoading(false) })
    return () => { active = false }
  }, [metadataAttempt])

  const dirty = initialized && snapshot(form, ticketing, tickets) !== cleanSnapshot.current
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const checks = useMemo<PublishCheck[]>(() => [
    { label: 'Titre et catégorie', complete: Boolean(form.title.trim() && form.category) },
    { label: 'Date et heure de début', complete: Boolean(form.eventDate && form.startTime) },
    { label: 'Lieu et commune', complete: Boolean(form.venueName.trim() && form.communeId) },
    { label: ticketing ? 'Billets : nom, prix et places' : 'Billetterie désactivée', complete: !ticketing || tickets.every((ticket) => ticket.name.trim() && Number.isInteger(Number(ticket.priceXpf)) && Number(ticket.priceXpf) >= 0 && Number.isInteger(Number(ticket.quantity)) && Number(ticket.quantity) >= 1) },
    { label: 'Organisateur et e-mail', complete: Boolean(form.organizerName.trim() && emailPattern.test(form.organizerEmail)) },
  ], [form, ticketing, tickets])

  const done = checks.filter((check) => check.complete).length
  const remaining = checks.length - done
  const categoryLabel = EVENT_CATEGORIES.find((option) => option.value === form.category)?.label || 'Catégorie'
  const communeName = communes.find((commune) => String(commune.id) === form.communeId)?.name || ''
  const capacity = tickets.reduce((total, ticket) => total + (Number.parseInt(ticket.quantity, 10) || 0), 0)

  const updateField = <K extends keyof EventPublishDraft>(key: K, value: EventPublishDraft[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
    setSubmitError(''); setSuccess('')
  }
  const updateTicket = (index: number, key: keyof EventTicketDraft, value: string) => {
    setTickets((current) => current.map((ticket, ticketIndex) => ticketIndex === index ? { ...ticket, [key]: value } : ticket))
    setTicketErrors((current) => current.map((error, errorIndex) => errorIndex === index ? { ...error, [key]: undefined } : error))
    setSubmitError(''); setSuccess('')
  }
  const requireAuth = () => {
    if (isAuthenticated) return false
    openAuthModal({ type: 'publish_listing', redirectTo: '/evenements/publier' })
    return true
  }
  const handleSaveDraft = () => {
    if (requireAuth()) return
    setSavingDraft(true); setSubmitError('')
    try {
      saveLocalEventDraft(user?.id, { form, ticketing, tickets, savedAt: new Date().toISOString() })
      cleanSnapshot.current = snapshot(form, ticketing, tickets)
      setSuccess('Brouillon enregistré sur cet appareil.')
    } catch { setSubmitError('Impossible d’enregistrer le brouillon. Réessaie.') }
    finally { setSavingDraft(false) }
  }

  const validate = () => {
    const errors: FieldErrors = {}
    const nextTicketErrors: TicketErrors[] = tickets.map(() => ({}))
    if (!form.title.trim()) errors.title = 'Indique le titre de l’événement.'
    if (!form.category) errors.category = 'Choisis une catégorie.'
    if (!form.eventDate) errors.eventDate = 'Choisis une date.'
    if (!form.startTime) errors.startTime = 'Indique l’heure de début.'
    if (!form.venueName.trim()) errors.venueName = 'Indique le lieu.'
    if (!form.communeId) errors.communeId = 'Choisis une commune.'
    if (!form.organizerName.trim()) errors.organizerName = 'Indique le nom de l’organisateur.'
    if (!emailPattern.test(form.organizerEmail)) errors.organizerEmail = 'Indique une adresse e-mail valide.'
    if (!validUrl(form.coverImageUrl)) errors.coverImageUrl = 'Utilise une adresse commençant par http:// ou https://.'
    if (!validUrl(form.websiteUrl)) errors.websiteUrl = 'Utilise une adresse commençant par http:// ou https://.'
    if (ticketing) tickets.forEach((ticket, index) => {
      if (!ticket.name.trim()) nextTicketErrors[index].name = 'Indique un nom.'
      if (!Number.isInteger(Number(ticket.priceXpf)) || Number(ticket.priceXpf) < 0) nextTicketErrors[index].priceXpf = 'Saisis un entier positif ou nul.'
      if (!Number.isInteger(Number(ticket.quantity)) || Number(ticket.quantity) < 1) nextTicketErrors[index].quantity = 'Prévois au moins une place.'
    })
    setFieldErrors(errors); setTicketErrors(nextTicketErrors)
    const ticketInvalid = nextTicketErrors.some((ticket) => Object.keys(ticket).length > 0)
    if (errors.title || errors.category) titleRef.current?.focus()
    else if (errors.eventDate || errors.startTime) dateRef.current?.focus()
    else if (errors.venueName || errors.communeId) venueRef.current?.focus()
    else if (ticketInvalid) firstTicketRef.current?.focus()
    else if (errors.organizerName) organizerRef.current?.focus()
    else if (errors.organizerEmail) emailRef.current?.focus()
    return Object.keys(errors).length === 0 && !ticketInvalid
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (requireAuth() || !validate()) return
    setPublishing(true); setSubmitError(''); setSuccess('')
    try {
      const result = await publishEvent(form, ticketing, tickets)
      clearLocalEventDraft(user?.id)
      cleanSnapshot.current = snapshot(form, ticketing, tickets)
      window.location.assign(result.href)
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
      setSubmitError(message || 'Impossible de publier l’événement. Réessaie.')
    } finally { setPublishing(false) }
  }

  if (!hasHydrated || !initialized) return <main className="min-h-screen bg-cream"><Header /><div className="mx-auto max-w-7xl space-y-5 px-5 py-10 sm:px-12"><div className="h-32 animate-pulse rounded-card bg-cream-sunken" />{[1, 2, 3, 4].map((item) => <div key={item} className="h-48 animate-pulse rounded-card bg-cream-surface" />)}</div></main>

  return (
    <main className="min-h-screen bg-cream text-ink">
      <Header />
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-12 sm:py-12">
        <Link href="/evenements" className="inline-flex min-h-11 items-center gap-2 text-label font-semibold text-ink/70 hover:text-ink"><ArrowLeft className="h-4 w-4" />Retour au calendrier</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl"><p className="text-eyebrow uppercase text-accent-text">Événement · Billetterie intégrée</p><h1 className="mt-3 font-display text-display-sm leading-none sm:text-display">Publie ton événement.</h1><p className="mt-4 max-w-2xl text-body text-ink/70">Présente ton rendez-vous, ouvre les réservations et retrouve les billets avec QR code directement dans Kalico.</p></div>
          <p aria-live="polite" className="flex items-center gap-2 text-label font-semibold"><span className="h-2.5 w-2.5 rounded-pill bg-accent" aria-hidden="true" />{done} sur 5 blocs prêts</p>
        </div>
        {metadataError ? <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-control border border-alert-error bg-cream-surface p-4 text-body-sm"><span>{metadataError}</span><Button variant="secondary" compact onClick={() => setMetadataAttempt((value) => value + 1)}>Réessayer</Button></div> : null}

        <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-10 min-[1100px]:flex-row min-[1100px]:items-start">
          <div className="min-w-0 flex-[1_1_560px] space-y-5">
            <EventFormSection number={1} title="L’événement">
              <Input ref={titleRef} label="Titre" value={form.title} error={fieldErrors.title} placeholder="Ex. Concert sous les étoiles" onChange={(event) => updateField('title', event.target.value)} />
              <fieldset className="mt-5"><legend className="text-label-sm font-semibold">Catégorie</legend><div className="mt-2 flex flex-wrap gap-2" aria-invalid={Boolean(fieldErrors.category)}>{EVENT_CATEGORIES.map((category) => <FilterChip key={category.value} selected={form.category === category.value} onClick={() => updateField('category', category.value)}>{category.label}</FilterChip>)}</div>{fieldErrors.category ? <p role="alert" className="mt-2 text-meta text-alert-error">{fieldErrors.category}</p> : null}</fieldset>
              <div className="mt-5"><Textarea label="Description" rows={4} value={form.description} placeholder="Donne envie de venir et précise les informations utiles." onChange={(event) => updateField('description', event.target.value)} /></div>
              <div className="mt-5"><p className="text-label-sm font-semibold">Photo de couverture · facultative</p><div className="mt-2 flex h-48 items-center justify-center overflow-hidden rounded-control border border-dashed border-warm-border bg-cream-sunken text-ink/45">{form.coverImageUrl && validUrl(form.coverImageUrl) ? <img src={form.coverImageUrl} alt="Aperçu de la couverture" className="h-full w-full object-cover" /> : <div className="text-center"><ImageIcon className="mx-auto h-10 w-10" aria-hidden="true" /><p className="mt-2 text-body-sm">L’aperçu de la photo apparaîtra ici</p></div>}</div><div className="mt-3"><Input label="Adresse de la photo · facultative" type="url" value={form.coverImageUrl} error={fieldErrors.coverImageUrl} placeholder="https://…" hint="Le téléversement direct sera ajouté plus tard ; utilise pour l’instant une image déjà en ligne." onChange={(event) => updateField('coverImageUrl', event.target.value)} /></div></div>
            </EventFormSection>

            <EventFormSection number={2} title="Quand et où">
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]"><Input ref={dateRef} label="Date" type="date" value={form.eventDate} error={fieldErrors.eventDate} onChange={(event) => updateField('eventDate', event.target.value)} /><Input label="Début" type="time" value={form.startTime} error={fieldErrors.startTime} onChange={(event) => updateField('startTime', event.target.value)} /><Input label="Fin · facultative" type="time" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} /></div>
              <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]"><Input ref={venueRef} label="Lieu" value={form.venueName} error={fieldErrors.venueName} placeholder="Salle, place ou commerce" onChange={(event) => updateField('venueName', event.target.value)} /><Select label="Commune" value={form.communeId} error={fieldErrors.communeId} disabled={metadataLoading} onChange={(event) => updateField('communeId', event.target.value)}><option value="">{metadataLoading ? 'Chargement…' : 'Choisir une commune'}</option>{communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}</Select></div>
              <div className="mt-4"><Input label="Adresse · facultative" value={form.venueAddress} placeholder="Rue, numéro, repère utile" onChange={(event) => updateField('venueAddress', event.target.value)} /></div>
            </EventFormSection>

            <EventFormSection number={3} title="Billetterie" action={<Switch label={ticketing ? 'Billetterie activée' : 'Sans billetterie'} checked={ticketing} onChange={(event) => setTicketing(event.target.checked)} />}>
              <p className="text-body-sm text-ink/70">{ticketing ? 'Définis un ou plusieurs types de billets. Laisse le prix à 0 pour un événement gratuit avec réservation.' : 'L’événement est publié avec une entrée libre, sans réservation.'}</p>
              {ticketing ? <div className="mt-5 space-y-3">{tickets.map((ticket, index) => <TicketTypeCard key={index} ref={index === 0 ? firstTicketRef : undefined} index={index} ticket={ticket} errors={ticketErrors[index]} canRemove={tickets.length > 1} onChange={(key, value) => updateTicket(index, key, value)} onRemove={() => setTickets((current) => current.filter((_, ticketIndex) => ticketIndex !== index))} />)}<Button type="button" variant="secondary" className="w-full border-dashed" onClick={() => setTickets((current) => [...current, { ...NEW_TICKET }])}><Plus className="h-4 w-4" />Ajouter un type de billet</Button><div className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-cream-sunken px-4 py-3 text-body-sm"><span>Capacité totale <strong>{capacity.toLocaleString('fr-FR')} places</strong></span><span className="text-ink/65">Chaque billet reçoit un QR code unique, scanné à l’entrée depuis Kalico.</span></div></div> : null}
            </EventFormSection>

            <EventFormSection number={4} title="L’organisateur">
              <p className="text-body-sm text-ink/70">Ces informations sont reprises de ton profil. Les visiteurs te contactent par la messagerie : ton e-mail et ton téléphone ne sont pas affichés.</p>
              <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]"><Input ref={organizerRef} label="Nom de l’organisateur" value={form.organizerName} error={fieldErrors.organizerName} placeholder="Association, commerce ou nom" onChange={(event) => updateField('organizerName', event.target.value)} /><Input label="Site web · facultatif" type="url" value={form.websiteUrl} error={fieldErrors.websiteUrl} placeholder="https://" onChange={(event) => updateField('websiteUrl', event.target.value)} /><Input ref={emailRef} label="E-mail de contact" type="email" value={form.organizerEmail} error={fieldErrors.organizerEmail} placeholder="nom@exemple.nc" onChange={(event) => updateField('organizerEmail', event.target.value)} /><Input label="Téléphone · facultatif" type="tel" value={form.organizerPhone} placeholder="+687" onChange={(event) => updateField('organizerPhone', event.target.value)} /></div>
            </EventFormSection>
            <PublishPanel remaining={remaining} publishing={publishing} savingDraft={savingDraft} error={submitError} success={success} onSaveDraft={handleSaveDraft} />
          </div>

          <aside className="min-w-0 flex-[0_1_400px] space-y-5 min-[1100px]:min-w-[300px] min-[1100px]:sticky min-[1100px]:top-6"><EventPreviewCard form={form} ticketing={ticketing} tickets={tickets} categoryLabel={categoryLabel} communeName={communeName} /><PublishChecklist checks={checks} /><div className="rounded-card border border-dashed border-warm-border p-5"><h2 className="text-label font-semibold">Un doute ?</h2><p className="mt-2 text-body-sm text-ink/70">Publie d’abord un événement gratuit pour tester, tu pourras ajouter des billets payants ensuite.</p></div></aside>
        </form>
      </div>
    </main>
  )
}
