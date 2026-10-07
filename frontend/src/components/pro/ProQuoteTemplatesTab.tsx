'use client'

import { useMemo, useState } from 'react'
import { CopyPlus, FilePenLine, Plus, Save, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { deleteProQuoteTemplate, saveProQuoteTemplate } from '@/lib/data/pro-space'
import { calculateQuotePreview, formatXpf } from '@/lib/proSpacePresentation'
import type { ProQuoteConfig, ProQuoteItem, ProQuoteTemplate, ProQuoteTemplateInput, ProQuoteUnit } from '@/types/pro-space'

const unitLabels: Record<ProQuoteUnit, string> = {
  unit: 'Unité',
  hour: 'Heure',
  day: 'Jour',
  package: 'Forfait',
  meter: 'Mètre',
  square_meter: 'Mètre carré',
  kilometer: 'Kilomètre',
}

function blankItem(rate: number): ProQuoteItem {
  return { label: '', description: '', unit: 'unit', quantity: 1, unit_price_xpf: 0, tgc_rate: rate }
}

function blankTemplate(config: ProQuoteConfig): ProQuoteTemplateInput {
  return {
    name: '',
    subject: '',
    client_note: '',
    items: [blankItem(config.tgc_rates[0] ?? 0)],
    validity_days: 30,
    deposit_percent: 0,
  }
}

function inputClass() {
  return 'min-h-12 w-full rounded-field border border-warm-border bg-cream-surface px-4 text-base text-ink outline-none transition focus:border-ink'
}

export default function ProQuoteTemplatesTab({ initialTemplates, config }: { initialTemplates: ProQuoteTemplate[]; config: ProQuoteConfig }) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [selectedId, setSelectedId] = useState<number | string | null>(initialTemplates[0]?.id ?? null)
  const selected = templates.find((template) => template.id === selectedId)
  const [draft, setDraft] = useState<ProQuoteTemplateInput>(() => selected ? {
    name: selected.name,
    subject: selected.subject,
    client_note: selected.client_note,
    items: selected.items,
    validity_days: selected.validity_days,
    deposit_percent: selected.deposit_percent,
  } : blankTemplate(config))
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const preview = useMemo(() => calculateQuotePreview(draft.items, draft.deposit_percent), [draft.deposit_percent, draft.items])

  const selectTemplate = (template: ProQuoteTemplate) => {
    setSelectedId(template.id)
    setDraft({ name: template.name, subject: template.subject, client_note: template.client_note, items: template.items, validity_days: template.validity_days, deposit_percent: template.deposit_percent })
    setFeedback(null)
  }

  const startNew = () => {
    setSelectedId(null)
    setDraft(blankTemplate(config))
    setFeedback(null)
  }

  const updateItem = (index: number, changes: Partial<ProQuoteItem>) => {
    setDraft((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) }))
  }

  const save = async () => {
    if (!draft.name.trim() || !draft.subject.trim() || draft.items.some((item) => !item.label.trim())) {
      setFeedback({ tone: 'error', message: 'Renseignez le nom, l’objet et la désignation de chaque ligne.' })
      return
    }
    setSaving(true)
    setFeedback(null)
    try {
      const saved = await saveProQuoteTemplate(draft, selectedId ?? undefined)
      setTemplates((current) => selectedId == null ? [saved, ...current] : current.map((template) => template.id === selectedId ? saved : template))
      setSelectedId(saved.id)
      setFeedback({ tone: 'success', message: 'Le modèle est enregistré.' })
    } catch {
      setFeedback({ tone: 'error', message: 'Le modèle n’a pas pu être enregistré. Réessayez.' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (selectedId == null || !window.confirm('Supprimer ce modèle de devis ?')) return
    setSaving(true)
    setFeedback(null)
    try {
      await deleteProQuoteTemplate(selectedId)
      const remaining = templates.filter((template) => template.id !== selectedId)
      setTemplates(remaining)
      if (remaining[0]) selectTemplate(remaining[0])
      else startNew()
      setFeedback({ tone: 'success', message: 'Le modèle est supprimé.' })
    } catch {
      setFeedback({ tone: 'error', message: 'Le modèle n’a pas pu être supprimé.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit hover:border-warm-border">
        <div className="flex items-center justify-between gap-3"><div><p className="text-eyebrow uppercase text-accent-text">Bibliothèque</p><h2 className="mt-2 font-display text-h4">Modèles enregistrés</h2></div><CopyPlus className="h-6 w-6 text-info-text" aria-hidden="true" /></div>
        <Button variant="secondary" className="mt-5 w-full" onClick={startNew}><Plus className="h-4 w-4" aria-hidden="true" />Nouveau modèle</Button>
        <div className="mt-5 grid gap-2">
          {templates.map((template) => <button key={template.id} type="button" onClick={() => selectTemplate(template)} className={`min-h-14 rounded-control border px-4 text-left transition ${selectedId === template.id ? 'border-ink bg-ink text-cream' : 'border-warm-border bg-cream-surface text-ink hover:border-ink'}`}><span className="block font-semibold">{template.name}</span><span className={`mt-1 block text-label-sm ${selectedId === template.id ? 'text-cream/70' : 'text-ink/55'}`}>{template.items.length} ligne{template.items.length > 1 ? 's' : ''}</span></button>)}
          {!templates.length ? <p className="rounded-control bg-cream-sunken p-4 text-body-sm text-ink/65">Aucun modèle enregistré.</p> : null}
        </div>
      </Card>

      <Card className="hover:border-warm-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-eyebrow uppercase text-accent-text">Éditeur</p><h2 className="mt-2 font-display text-h3 font-normal">{selectedId == null ? 'Créer un modèle' : 'Modifier le modèle'}</h2><p className="mt-3 max-w-2xl text-body-sm text-ink/65">L’estimation est calculée dans le navigateur pour la prévisualisation. Le serveur recalcule toujours les montants enregistrés et le PDF.</p></div><FilePenLine className="h-7 w-7 text-info-text" aria-hidden="true" /></div>
        {feedback ? <FeedbackAlert tone={feedback.tone} className="mt-5">{feedback.message}</FeedbackAlert> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-label"><span>Nom du modèle</span><input className={inputClass()} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></label>
          <label className="grid gap-2 text-label"><span>Objet du devis</span><input className={inputClass()} value={draft.subject} onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))} /></label>
          <label className="grid gap-2 text-label"><span>Validité en jours</span><input type="number" min="1" max="365" className={inputClass()} value={draft.validity_days} onChange={(event) => setDraft((current) => ({ ...current, validity_days: Number(event.target.value) }))} /></label>
          <label className="grid gap-2 text-label"><span>Acompte en pourcentage</span><input type="number" min="0" max="100" step="0.01" className={inputClass()} value={draft.deposit_percent} onChange={(event) => setDraft((current) => ({ ...current, deposit_percent: Number(event.target.value) }))} /></label>
          <label className="grid gap-2 text-label md:col-span-2"><span>Note au client</span><textarea className={`${inputClass()} min-h-24 py-3`} value={draft.client_note ?? ''} onChange={(event) => setDraft((current) => ({ ...current, client_note: event.target.value }))} /></label>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4"><div><p className="text-eyebrow uppercase text-accent-text">Lignes</p><h3 className="mt-2 font-display text-h4">Prestations et produits</h3></div><Button variant="tertiary" compact onClick={() => setDraft((current) => ({ ...current, items: [...current.items, blankItem(config.tgc_rates[0] ?? 0)] }))}><Plus className="h-4 w-4" aria-hidden="true" />Ajouter</Button></div>
        <div className="mt-4 grid gap-4">
          {draft.items.map((item, index) => (
            <div key={item.id ?? index} className="rounded-card border border-warm-border bg-cream-sunken p-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(180px,1.5fr)_minmax(120px,0.7fr)_110px_150px_110px_auto] lg:items-end">
                <label className="grid gap-2 text-label"><span>Désignation</span><input className={inputClass()} value={item.label} onChange={(event) => updateItem(index, { label: event.target.value })} /></label>
                <label className="grid gap-2 text-label"><span>Unité</span><select className={inputClass()} value={item.unit} onChange={(event) => updateItem(index, { unit: event.target.value as ProQuoteUnit })}>{config.units.map((unit) => <option key={unit} value={unit}>{unitLabels[unit]}</option>)}</select></label>
                <label className="grid gap-2 text-label"><span>Quantité</span><input type="number" min="0.001" step="0.001" className={inputClass()} value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} /></label>
                <label className="grid gap-2 text-label"><span>Prix unitaire HT</span><input type="number" min="0" step="1" className={inputClass()} value={item.unit_price_xpf} onChange={(event) => updateItem(index, { unit_price_xpf: Number(event.target.value) })} /></label>
                <label className="grid gap-2 text-label"><span>TGC</span><select className={inputClass()} value={item.tgc_rate} onChange={(event) => updateItem(index, { tgc_rate: Number(event.target.value) })}>{config.tgc_rates.map((rate) => <option key={rate} value={rate}>{rate} %</option>)}</select></label>
                <button type="button" aria-label={`Supprimer la ligne ${index + 1}`} disabled={draft.items.length === 1} onClick={() => setDraft((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))} className="flex min-h-12 min-w-12 items-center justify-center rounded-control border border-warm-border text-alert-error transition hover:border-alert-error disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-5 w-5" aria-hidden="true" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 rounded-card bg-ink p-5 text-cream sm:grid-cols-5">
          {[['Sous-total HT', preview.subtotalXpf], ['TGC', preview.tgcXpf], ['Total TTC', preview.totalXpf], ['Acompte', preview.depositXpf], ['Solde', preview.balanceXpf]].map(([label, value]) => <div key={String(label)}><p className="text-label-sm text-cream/65">{label}</p><p className="mt-2 font-display text-h4">{formatXpf(Number(value))}</p></div>)}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="ghost" disabled={selectedId == null || saving} onClick={remove}><Trash2 className="h-4 w-4" aria-hidden="true" />Supprimer</Button>
          <Button loading={saving} loadingLabel="Enregistrement…" onClick={save}><Save className="h-4 w-4" aria-hidden="true" />Enregistrer le modèle</Button>
        </div>
      </Card>
    </div>
  )
}
