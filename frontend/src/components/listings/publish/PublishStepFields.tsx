'use client'

import { ImagePlus, Trash2 } from 'lucide-react'

import { Checkbox, FilterChip, SegmentedControl, Switch } from '@/components/ui/Controls'
import { Input, Select, Textarea } from '@/components/ui/Field'
import type { MissingField } from './publishingValidation'
import { BON_PLAN_CATEGORIES, CONDITION_OPTIONS, EVENT_CATEGORIES } from './publishingConfig'
import type { PublishingDraft, PublishingMetadata, PublishingPhoto } from '@/types/publishing'

type Props = {
  stepId: string
  draft: PublishingDraft
  metadata: PublishingMetadata
  photos: PublishingPhoto[]
  missing: MissingField[]
  update: <K extends keyof PublishingDraft>(key: K, value: PublishingDraft[K]) => void
  onAddPhotos: (files: FileList) => void
  onRemovePhoto: (index: number) => void
}

const DAYS = [
  { value: 1, label: 'Lun.' }, { value: 2, label: 'Mar.' }, { value: 3, label: 'Mer.' },
  { value: 4, label: 'Jeu.' }, { value: 5, label: 'Ven.' }, { value: 6, label: 'Sam.' },
  { value: 0, label: 'Dim.' },
]

function errorFor(missing: MissingField[], key: MissingField['key']) {
  return missing.find((item) => item.key === key)?.label
}

export default function PublishStepFields({ stepId, draft, metadata, photos, missing, update, onAddPhotos, onRemovePhoto }: Props) {
  const toggleString = (key: 'trocWants' | 'handoffModes', value: string) => {
    const values = draft[key]
    update(key, values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }
  const toggleDay = (value: number) => update('recurrenceDays', draft.recurrenceDays.includes(value)
    ? draft.recurrenceDays.filter((day) => day !== value)
    : [...draft.recurrenceDays, value])

  if (stepId === 'photos') {
    return (
      <div className="flex flex-col gap-5">
        <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-sand bg-cream-sunken p-6 text-center transition hover:border-ink/30">
          <ImagePlus className="h-7 w-7 text-accent-text" aria-hidden="true" />
          <span className="text-label font-semibold text-ink">Ajouter des photos</span>
          <span className="max-w-[480px] text-meta text-ink/65">JPEG, PNG, WebP ou HEIC. La première image devient la couverture.</span>
          <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple onChange={(event) => {
            if (event.target.files?.length) onAddPhotos(event.target.files)
            event.target.value = ''
          }} />
        </label>
        {errorFor(missing, 'photos') ? <p role="alert" className="text-meta text-alert-error">{errorFor(missing, 'photos')}</p> : null}
        {photos.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo, index) => (
              <div key={photo.id} className="relative aspect-square overflow-hidden rounded-card border border-sand bg-cream-sunken">
                <img src={photo.preview} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                {index === 0 ? <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-caption font-semibold text-ink-deep">Couverture</span> : null}
                <button type="button" onClick={() => onRemovePhoto(index)} aria-label={`Supprimer la photo ${index + 1}`} className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-cream-surface text-alert-error shadow-card">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  if (stepId === 'details') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input className="md:col-span-2" label="Titre" maxLength={70} value={draft.title} error={errorFor(missing, 'title')} onChange={(event) => update('title', event.target.value)} placeholder="Ex. Planche de surf avec housse" />
        <Select label="Catégorie" value={draft.categoryId} error={errorFor(missing, 'categoryId')} onChange={(event) => update('categoryId', event.target.value)}>
          <option value="">Choisir une catégorie</option>
          {metadata.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </Select>
        <Select label="État" value={draft.condition} onChange={(event) => update('condition', event.target.value as PublishingDraft['condition'])}>
          {CONDITION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
        <Textarea className="md:col-span-2" label="Description" maxLength={2000} value={draft.description} error={errorFor(missing, 'description')} onChange={(event) => update('description', event.target.value)} placeholder="Dimensions, marque, ancienneté, défauts éventuels…" />
      </div>
    )
  }

  if (stepId === 'price') {
    return (
      <div className="flex max-w-[620px] flex-col gap-5">
        <Input label="Prix" type="number" min={10} step={10} suffix="XPF" value={draft.priceXpf} error={errorFor(missing, 'priceXpf')} onChange={(event) => update('priceXpf', event.target.value)} />
        <Switch label="Prix négociable" checked={draft.negotiable} onChange={(event) => update('negotiable', event.target.checked)} />
        <fieldset>
          <legend className="mb-3 text-label-sm font-semibold text-ink">Mode de remise</legend>
          <div className="flex flex-wrap gap-2">
            {['En main propre', 'Envoi vers les Îles', 'Livraison par mes soins'].map((mode) => <FilterChip key={mode} selected={draft.handoffModes.includes(mode)} onClick={() => toggleString('handoffModes', mode)}>{mode}</FilterChip>)}
          </div>
        </fieldset>
      </div>
    )
  }

  if (stepId === 'exchange') {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Valeur estimée" type="number" min={10} step={10} suffix="XPF" value={draft.priceXpf} error={errorFor(missing, 'priceXpf')} hint="Elle sert à équilibrer les propositions du trocomètre." onChange={(event) => update('priceXpf', event.target.value)} />
        <Input label="Complément maximal accepté" type="number" min={0} step={1000} suffix="XPF" value={draft.trocComplementXpf} onChange={(event) => update('trocComplementXpf', event.target.value)} />
        <fieldset className="md:col-span-2">
          <legend className="mb-3 text-label-sm font-semibold text-ink">Catégories recherchées</legend>
          <div className="flex flex-wrap gap-2">
            {metadata.categories.slice(0, 14).map((category) => <FilterChip key={category.id} selected={draft.trocWants.includes(category.name)} onClick={() => toggleString('trocWants', category.name)}>{category.name}</FilterChip>)}
          </div>
          {errorFor(missing, 'trocWants') ? <p role="alert" className="mt-2 text-meta text-alert-error">{errorFor(missing, 'trocWants')}</p> : null}
        </fieldset>
        <Textarea className="md:col-span-2" label="Ce que vous aimeriez idéalement" value={draft.trocWish} maxLength={200} onChange={(event) => update('trocWish', event.target.value)} placeholder="Ex. Un kayak ou un paddle familial." />
      </div>
    )
  }

  if (stepId === 'location') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Commune" value={draft.communeId} error={errorFor(missing, 'communeId')} onChange={(event) => update('communeId', event.target.value)}>
          <option value="">Choisir une commune</option>
          {metadata.communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}
        </Select>
        <Input label="Quartier ou lieu-dit" value={draft.quartier} onChange={(event) => update('quartier', event.target.value)} placeholder="Ex. Boulari" hint="Facultatif, l’adresse exacte n’est jamais affichée." />
      </div>
    )
  }

  if (stepId === 'offer') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input className="md:col-span-2" label="Titre de l’offre" maxLength={70} value={draft.title} error={errorFor(missing, 'title')} onChange={(event) => update('title', event.target.value)} placeholder="Ex. −30 % sur les planches de surf" />
        <Input label="Commerce" value={draft.businessName} error={errorFor(missing, 'businessName')} onChange={(event) => update('businessName', event.target.value)} />
        <Select label="Catégorie" value={draft.bonPlanCategory} onChange={(event) => update('bonPlanCategory', event.target.value)}>{BON_PLAN_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>
        <div className="md:col-span-2"><SegmentedControl label="Type de réduction" value={draft.discountMode} onChange={(value) => update('discountMode', value as PublishingDraft['discountMode'])} options={[{ value: 'percentage', label: 'Pourcentage' }, { value: 'strikethrough', label: 'Prix barré' }, { value: 'gift', label: 'Offert' }]} /></div>
        {draft.discountMode === 'percentage' ? <Input label="Réduction" type="number" min={1} max={90} suffix="%" value={draft.discountPercent} error={errorFor(missing, 'discountPercent')} onChange={(event) => update('discountPercent', event.target.value)} /> : null}
        {draft.discountMode === 'strikethrough' ? <><Input label="Prix habituel" type="number" min={10} step={10} suffix="XPF" value={draft.originalPriceXpf} error={errorFor(missing, 'originalPriceXpf')} onChange={(event) => update('originalPriceXpf', event.target.value)} /><Input label="Prix remisé" type="number" min={0} step={10} suffix="XPF" value={draft.promoPriceXpf} onChange={(event) => update('promoPriceXpf', event.target.value)} /></> : null}
        {draft.discountMode === 'gift' ? <Input className="md:col-span-2" label="Ce qui est offert" value={draft.giftDescription} error={errorFor(missing, 'giftDescription')} onChange={(event) => update('giftDescription', event.target.value)} /> : null}
        <Input label="Code promo" value={draft.promoCode} onChange={(event) => update('promoCode', event.target.value)} placeholder="Facultatif" />
        <Textarea className="md:col-span-2" label="Description" maxLength={500} value={draft.description} error={errorFor(missing, 'description')} onChange={(event) => update('description', event.target.value)} />
      </div>
    )
  }

  if (stepId === 'validity') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Début" type="date" value={draft.validFrom} error={errorFor(missing, 'validFrom')} onChange={(event) => update('validFrom', event.target.value)} />
        <Input label="Fin" type="date" value={draft.validUntil} error={errorFor(missing, 'validUntil')} onChange={(event) => update('validUntil', event.target.value)} />
        <Select label="Durée de publication" value={draft.durationDays} onChange={(event) => update('durationDays', event.target.value as PublishingDraft['durationDays'])}><option value="7">7 jours</option><option value="30">30 jours</option></Select>
        <Input label="E-mail de contact" type="email" value={draft.contactEmail} error={errorFor(missing, 'contactEmail')} onChange={(event) => update('contactEmail', event.target.value)} />
        <Textarea className="md:col-span-2" label="Conditions" maxLength={500} value={draft.conditions} onChange={(event) => update('conditions', event.target.value)} placeholder="Facultatif" />
      </div>
    )
  }

  if (stepId === 'store') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><SegmentedControl label="Canal" value={draft.channel} onChange={(value) => update('channel', value as PublishingDraft['channel'])} options={[{ value: 'store', label: 'En magasin' }, { value: 'online', label: 'En ligne' }, { value: 'both', label: 'Les deux' }]} /></div>
        {draft.channel !== 'online' ? <><Input className="md:col-span-2" label="Adresse du commerce" value={draft.address} error={errorFor(missing, 'address')} onChange={(event) => update('address', event.target.value)} /><Select label="Commune" value={draft.communeId} error={errorFor(missing, 'communeId')} onChange={(event) => update('communeId', event.target.value)}><option value="">Choisir une commune</option>{metadata.communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}</Select></> : null}
        {draft.channel !== 'store' ? <Input className="md:col-span-2" label="Lien vers l’offre" type="url" value={draft.websiteUrl} error={errorFor(missing, 'websiteUrl')} onChange={(event) => update('websiteUrl', event.target.value)} placeholder="https://" /> : null}
      </div>
    )
  }

  if (stepId === 'route') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Départ" value={draft.departureCommuneId} error={errorFor(missing, 'departureCommuneId')} onChange={(event) => { update('departureCommuneId', event.target.value); update('departure', metadata.communes.find((commune) => String(commune.id) === event.target.value)?.name ?? '') }}><option value="">Choisir une commune</option>{metadata.communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}</Select>
        <Select label="Arrivée" value={draft.destinationCommuneId} error={errorFor(missing, 'destinationCommuneId')} onChange={(event) => { update('destinationCommuneId', event.target.value); update('destination', metadata.communes.find((commune) => String(commune.id) === event.target.value)?.name ?? '') }}><option value="">Choisir une commune</option>{metadata.communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}</Select>
        <Input className="md:col-span-2" label="Arrêts possibles" value={draft.stops} onChange={(event) => update('stops', event.target.value)} hint="Séparez les arrêts par des virgules." placeholder="Ex. Païta, La Foa, Bourail" />
      </div>
    )
  }

  if (stepId === 'schedule') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><SegmentedControl label="Fréquence" value={draft.frequency} onChange={(value) => update('frequency', value as PublishingDraft['frequency'])} options={[{ value: 'once', label: 'Une fois' }, { value: 'weekly', label: 'Chaque semaine' }]} /></div>
        <Input label="Date de départ" type="date" value={draft.rideDate} error={errorFor(missing, 'rideDate')} onChange={(event) => update('rideDate', event.target.value)} />
        <Input label="Heure de départ" type="time" value={draft.rideTime} error={errorFor(missing, 'rideTime')} onChange={(event) => update('rideTime', event.target.value)} />
        {draft.frequency === 'weekly' ? <fieldset className="md:col-span-2"><legend className="mb-3 text-label-sm font-semibold text-ink">Jours de répétition</legend><div className="flex flex-wrap gap-2">{DAYS.map((day) => <FilterChip key={day.value} selected={draft.recurrenceDays.includes(day.value)} onClick={() => toggleDay(day.value)}>{day.label}</FilterChip>)}</div>{errorFor(missing, 'recurrenceDays') ? <p role="alert" className="mt-2 text-meta text-alert-error">{errorFor(missing, 'recurrenceDays')}</p> : null}</fieldset> : null}
      </div>
    )
  }

  if (stepId === 'seats') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Places disponibles" type="number" min={1} max={8} value={draft.seats} error={errorFor(missing, 'seats')} onChange={(event) => update('seats', event.target.value)} />
        <Input label="Participation par place" type="number" min={0} step={10} suffix="XPF" value={draft.priceXpf} error={errorFor(missing, 'priceXpf')} hint="Aucun prix conseillé n’est calculé sans source métier fiable." onChange={(event) => update('priceXpf', event.target.value)} />
        <Select label="Bagages acceptés" value={draft.luggage} onChange={(event) => update('luggage', event.target.value as PublishingDraft['luggage'])}><option>Petit sac</option><option>Valise</option><option>Volumineux</option></Select>
        <div className="flex flex-col gap-3 pt-7"><Checkbox label="Non-fumeur" checked={draft.noSmoking} onChange={(event) => update('noSmoking', event.target.checked)} /><Checkbox label="Musique acceptée" checked={draft.musicAllowed} onChange={(event) => update('musicAllowed', event.target.checked)} /><Checkbox label="Animaux acceptés" checked={draft.animalsAllowed} onChange={(event) => update('animalsAllowed', event.target.checked)} /><Checkbox label="Femmes uniquement" checked={draft.womenOnly} onChange={(event) => update('womenOnly', event.target.checked)} /></div>
      </div>
    )
  }

  if (stepId === 'vehicle') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Véhicule" value={draft.vehicle} error={errorFor(missing, 'vehicle')} onChange={(event) => update('vehicle', event.target.value)} placeholder="Ex. Toyota Hilux blanc" />
        <Input label="Confort ou point de rendez-vous" value={draft.comfort} onChange={(event) => update('comfort', event.target.value)} placeholder="Facultatif" />
        <Textarea className="md:col-span-2" label="Description du trajet" value={draft.description} error={errorFor(missing, 'description')} onChange={(event) => update('description', event.target.value)} />
        <Switch className="md:col-span-2" label="Réservation instantanée" checked={draft.instantBooking} onChange={(event) => update('instantBooking', event.target.checked)} />
      </div>
    )
  }

  if (stepId === 'event-info') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input className="md:col-span-2" label="Nom de l’événement" maxLength={80} value={draft.title} error={errorFor(missing, 'title')} onChange={(event) => update('title', event.target.value)} />
        <Select label="Catégorie" value={draft.eventCategory} onChange={(event) => update('eventCategory', event.target.value)}>{EVENT_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>
        <Input label="Organisateur" value={draft.organizerName} error={errorFor(missing, 'organizerName')} onChange={(event) => update('organizerName', event.target.value)} />
        <Textarea className="md:col-span-2" label="Programme" maxLength={2000} value={draft.description} error={errorFor(missing, 'description')} onChange={(event) => update('description', event.target.value)} />
      </div>
    )
  }

  if (stepId === 'event-place') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Date" type="date" value={draft.eventDate} error={errorFor(missing, 'eventDate')} onChange={(event) => update('eventDate', event.target.value)} />
        <Input label="Heure de début" type="time" value={draft.eventTime} error={errorFor(missing, 'eventTime')} onChange={(event) => update('eventTime', event.target.value)} />
        <Input label="Heure de fin" type="time" value={draft.eventEndTime} onChange={(event) => update('eventEndTime', event.target.value)} />
        <Input label="Lieu" value={draft.venueName} error={errorFor(missing, 'venueName')} onChange={(event) => update('venueName', event.target.value)} />
        <Input className="md:col-span-2" label="Adresse ou précision" value={draft.venueAddress} onChange={(event) => update('venueAddress', event.target.value)} />
        <Select label="Commune" value={draft.communeId} error={errorFor(missing, 'communeId')} onChange={(event) => update('communeId', event.target.value)}><option value="">Choisir une commune</option>{metadata.communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}</Select>
      </div>
    )
  }

  if (stepId === 'event-access') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><SegmentedControl label="Entrée" value={draft.eventAccess} onChange={(value) => update('eventAccess', value as PublishingDraft['eventAccess'])} options={[{ value: 'free', label: 'Gratuite' }, { value: 'paid', label: 'Payante' }, { value: 'registration', label: 'Sur inscription' }]} /></div>
        {draft.eventAccess === 'paid' ? <Input label="Prix d’entrée" type="number" min={0} step={10} suffix="XPF" value={draft.priceXpf} error={errorFor(missing, 'priceXpf')} onChange={(event) => update('priceXpf', event.target.value)} /> : null}
        {draft.eventAccess === 'registration' ? <Input className="md:col-span-2" label="Lien d’inscription" type="url" value={draft.bookingUrl} error={errorFor(missing, 'bookingUrl')} onChange={(event) => update('bookingUrl', event.target.value)} placeholder="https://" /> : null}
        <Input label="Capacité" type="number" min={0} max={5000} value={draft.capacity} onChange={(event) => update('capacity', event.target.value)} hint="0 = non précisée" />
      </div>
    )
  }

  return (
    <div className="rounded-card border border-sand bg-cream-sunken p-5 text-body-sm text-ink/70">
      Vérifiez l’aperçu et les informations avant de publier. Aucun paiement ni boost n’est déclenché sans confirmation explicite.
    </div>
  )
}
