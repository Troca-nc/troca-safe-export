'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Save, Send, Sparkles, Trash2, X } from 'lucide-react'

import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { proQuotesApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'

type QuoteRequestPrefill = {
  id?: string | number
  requesterUserId?: number | string | null
  requester_name?: string | null
  requester_email?: string | null
  requester_phone?: string | null
  commune?: string | null
  need_type?: string | null
  budget_xpf?: string | number | null
  desired_date?: string | null
  details?: string | null
}

type QuoteItemForm = {
  id: string
  label: string
  description: string
  quantity: string
  unit_price_xpf: string
}

type QuoteBuilderProps = {
  open: boolean
  onClose: () => void
  proId: string | number
  proName: string
  initialRequest?: QuoteRequestPrefill | null
  onFinished?: () => void
}

type QuoteForm = {
  requester_name: string
  requester_email: string
  requester_phone: string
  commune: string
  subject: string
  client_note: string
  tax_rate: string
  validity_days: string
}

const EMPTY_ITEM = (): QuoteItemForm => ({
  id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  label: '',
  description: '',
  quantity: '1',
  unit_price_xpf: '',
})

function formatMoney(value: number) {
  return `${value.toLocaleString('fr-FR')} XPF`
}

function computeTotals(items: QuoteItemForm[], taxRate: number) {
  const subtotal = items.reduce((sum, item) => {
    const quantity = Math.max(1, Number(item.quantity || 1))
    const unit = Math.max(0, Number(item.unit_price_xpf || 0))
    return sum + quantity * unit
  }, 0)
  const tax = Math.round((subtotal * taxRate) / 100)
  return {
    subtotal,
    tax,
    total: subtotal + tax,
  }
}

export default function QuoteBuilder({
  open,
  onClose,
  proId,
  proName,
  initialRequest,
  onFinished,
}: QuoteBuilderProps) {
  const { user } = useAuthStore()
  const [saving, setSaving] = useState<null | 'draft' | 'send'>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState<QuoteForm>({
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    commune: '',
    subject: '',
    client_note: '',
    tax_rate: '0',
    validity_days: '30',
  })
  const [items, setItems] = useState<QuoteItemForm[]>([EMPTY_ITEM()])

  useEffect(() => {
    if (!open) return
    setError('')
    setSaving(null)
    setForm({
      requester_name: initialRequest?.requester_name?.trim() || [user?.prenom, user?.nom].filter(Boolean).join(' ').trim(),
      requester_email: initialRequest?.requester_email?.trim() || user?.email || '',
      requester_phone: initialRequest?.requester_phone?.trim() || user?.telephone || '',
      commune: initialRequest?.commune?.trim() || user?.commune_name || '',
      subject: initialRequest?.need_type?.trim() || 'Nouveau devis',
      client_note: initialRequest?.details?.trim() || '',
      tax_rate: '0',
      validity_days: '30',
    })
    const budget = Number(initialRequest?.budget_xpf || 0)
    const firstItem = EMPTY_ITEM()
    if (initialRequest?.need_type?.trim()) {
      firstItem.label = initialRequest.need_type.trim()
    } else {
      firstItem.label = 'Prestation principale'
    }
    firstItem.description = initialRequest?.details?.trim() || ''
    firstItem.unit_price_xpf = Number.isFinite(budget) && budget > 0 ? String(budget) : ''
    setItems([firstItem])
  }, [initialRequest, open, user?.commune_name, user?.email, user?.nom, user?.prenom, user?.telephone])

  const totals = useMemo(() => computeTotals(items, Number(form.tax_rate || 0)), [form.tax_rate, items])

  if (!open) return null

  const updateItem = (id: string, patch: Partial<QuoteItemForm>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const addItem = () => setItems((current) => [...current, EMPTY_ITEM()])
  const removeItem = (id: string) => setItems((current) => (current.length <= 1 ? current : current.filter((item) => item.id !== id)))

  const submit = async (mode: 'draft' | 'send') => {
    setSaving(mode)
    setError('')

    try {
      if (!form.requester_name.trim()) throw new Error('Le nom du client est requis.')
      if (!form.requester_email.trim() || !form.requester_email.includes('@')) throw new Error('Un email client valide est requis.')
      if (!form.commune.trim()) throw new Error('La commune est requise.')
      if (!form.subject.trim()) throw new Error('L’objet du devis est requis.')

      const normalizedItems = items.map((item, index) => ({
        label: item.label.trim() || `Ligne ${index + 1}`,
        description: item.description.trim() || null,
        quantity: Math.max(1, Number(item.quantity || 1)),
        unit_price_xpf: Math.max(0, Math.round(Number(item.unit_price_xpf || 0))),
      })).filter((item) => item.label.trim().length > 0)

      if (normalizedItems.length === 0) {
        throw new Error('Ajoutez au moins une ligne de devis.')
      }

      const created = await proQuotesApi.create({
        requester_user_id: initialRequest?.requesterUserId != null ? Number(initialRequest.requesterUserId) : null,
        requester_name: form.requester_name.trim(),
        requester_email: form.requester_email.trim(),
        requester_phone: form.requester_phone.trim() || null,
        commune: form.commune.trim(),
        subject: form.subject.trim(),
        client_note: form.client_note.trim() || null,
        items: normalizedItems,
        tax_rate: Number(form.tax_rate || 0),
        validity_days: Number(form.validity_days || 30),
        source_quote_request_id: initialRequest?.id ? Number(initialRequest.id) : null,
      })

      const quoteId = created.data?.data?.id
      if (mode === 'send' && quoteId) {
        await proQuotesApi.send(quoteId, { validity_days: Number(form.validity_days || 30) })
      }

      showToast({
        tone: 'success',
        title: mode === 'send' ? 'Devis envoyé' : 'Brouillon enregistré',
        message: mode === 'send'
          ? `${proName} peut maintenant consulter ce devis.`
          : 'Le devis a été sauvegardé en brouillon.',
      })
      onFinished?.()
      onClose()
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Impossible de sauvegarder ce devis.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Devis non enregistré',
        message,
      })
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-[var(--color-surface)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-emeraude">QuoteBuilder</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Nouveau devis pour {proName}</h2>
            <p className="mt-1 text-sm text-night/55">Créez un brouillon, puis envoyez-le au client avec un lien sécurisé.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-night/45 transition hover:bg-sand hover:text-night"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="min-h-0 overflow-y-auto border-b border-[var(--color-border)] px-6 py-6 lg:border-b-0 lg:border-r">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Client *</span>
                  <input
                    value={form.requester_name}
                    onChange={(event) => setForm((current) => ({ ...current, requester_name: event.target.value }))}
                    className="input w-full rounded-2xl"
                    placeholder="Nom du client"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Email client *</span>
                  <input
                    type="email"
                    value={form.requester_email}
                    onChange={(event) => setForm((current) => ({ ...current, requester_email: event.target.value }))}
                    className="input w-full rounded-2xl"
                    placeholder="client@email.com"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Téléphone</span>
                  <input
                    value={form.requester_phone}
                    onChange={(event) => setForm((current) => ({ ...current, requester_phone: event.target.value }))}
                    className="input w-full rounded-2xl"
                    placeholder="XX XX XX XX"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Commune *</span>
                  <input
                    value={form.commune}
                    onChange={(event) => setForm((current) => ({ ...current, commune: event.target.value }))}
                    className="input w-full rounded-2xl"
                    placeholder="Nouméa, Dumbéa..."
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Objet du devis *</span>
                <input
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="Ex. rénovation salle de bain"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Note client</span>
                <textarea
                  rows={3}
                  value={form.client_note}
                  onChange={(event) => setForm((current) => ({ ...current, client_note: event.target.value }))}
                  className="input w-full rounded-2xl py-3"
                  placeholder="Contexte, urgence, contraintes, précisions..."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">TVA</span>
                  <select
                    value={form.tax_rate}
                    onChange={(event) => setForm((current) => ({ ...current, tax_rate: event.target.value }))}
                    className="input w-full rounded-2xl"
                  >
                    <option value="0">0%</option>
                    <option value="11">11%</option>
                    <option value="22">22%</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Validité</span>
                  <select
                    value={form.validity_days}
                    onChange={(event) => setForm((current) => ({ ...current, validity_days: event.target.value }))}
                    className="input w-full rounded-2xl"
                  >
                    <option value="15">15 jours</option>
                    <option value="30">30 jours</option>
                    <option value="60">60 jours</option>
                    <option value="90">90 jours</option>
                  </select>
                </label>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Montant total</p>
                  <p className="mt-1 text-xl font-bold text-night">{formatMoney(totals.total)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Lignes</p>
                    <h3 className="font-display text-xl font-bold text-night">Détaillez les prestations</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une ligne
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-night">Ligne {index + 1}</p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-[1.4fr_1fr_0.7fr_0.7fr]">
                        <label className="space-y-2">
                          <span className="text-xs font-semibold text-night/60">Libellé</span>
                          <input
                            value={item.label}
                            onChange={(event) => updateItem(item.id, { label: event.target.value })}
                            className="input w-full rounded-2xl"
                            placeholder="Prestation, produit, matériel..."
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-semibold text-night/60">Description</span>
                          <input
                            value={item.description}
                            onChange={(event) => updateItem(item.id, { description: event.target.value })}
                            className="input w-full rounded-2xl"
                            placeholder="Détails complémentaires"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-semibold text-night/60">Qté</span>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                            className="input w-full rounded-2xl"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-semibold text-night/60">Prix unitaire</span>
                          <input
                            type="number"
                            min={0}
                            value={item.unit_price_xpf}
                            onChange={(event) => updateItem(item.id, { unit_price_xpf: event.target.value })}
                            className="input w-full rounded-2xl"
                            placeholder="0"
                          />
                        </label>
                      </div>
                      <div className="mt-3 text-right text-xs font-semibold text-night/55">
                        Total ligne : {formatMoney(Math.max(1, Number(item.quantity || 1)) * Math.max(0, Number(item.unit_price_xpf || 0)))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error ? (
                <FeedbackAlert tone="error" title="Enregistrement impossible">
                  {error}
                </FeedbackAlert>
              ) : null}
            </div>
          </div>

          <aside className="min-h-0 overflow-y-auto px-6 py-6">
            <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Aperçu</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-night">{form.subject || 'Devis'}</h3>
              <p className="mt-1 text-sm text-night/60">{form.requester_name || 'Client'} · {form.commune || 'Commune'}</p>

              <div className="mt-5 space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-night">{index + 1}. {item.label || 'Ligne'}</p>
                        {item.description ? <p className="mt-1 text-sm text-night/55">{item.description}</p> : null}
                      </div>
                      <div className="text-right text-sm font-semibold text-night">
                        {formatMoney(Math.max(1, Number(item.quantity || 1)) * Math.max(0, Number(item.unit_price_xpf || 0)))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2 rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4">
                <div className="flex items-center justify-between text-sm text-night/65">
                  <span>Sous-total</span>
                  <span className="font-semibold text-night">{formatMoney(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-night/65">
                  <span>TVA ({form.tax_rate || '0'}%)</span>
                  <span className="font-semibold text-night">{formatMoney(totals.tax)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-base font-bold text-night">
                  <span>Total</span>
                  <span>{formatMoney(totals.total)}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => void submit('draft')}
                  disabled={saving !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)] disabled:opacity-60"
                >
                  {saving === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Sauvegarder brouillon
                </button>
                <button
                  type="button"
                  onClick={() => void submit('send')}
                  disabled={saving !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:opacity-60"
                >
                  {saving === 'send' ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
                  Envoyer le devis
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-white"
                >
                  Fermer
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
