'use client'

import { useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { trocApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useAuthActionStore } from '@/store/authActionStore'

type Props = {
  listingId: string | number
  listingTitle: string
}

export default function TrocProposalForm({ listingId, listingTitle }: Props) {
  const { isAuthenticated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [offeredDescription, setOfferedDescription] = useState('')
  const [complementDirection, setComplementDirection] = useState<'none' | 'i_pay' | 'they_pay'>('none')
  const [complementXpf, setComplementXpf] = useState(0)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const snapTo10 = (value: number) => Math.max(0, Math.round(value / 10) * 10)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccess(null)
    setError(null)

    if (!offeredDescription.trim()) {
      setError('D�crivez au moins ce que vous proposez pour que la proposition soit valide.')
      return
    }

    if (!isAuthenticated) {
      openAuthModal({
        type: 'troc_proposal',
        listingId: String(listingId),
        redirectTo: `/troc/${listingId}`,
      })
      return
    }

    setSending(true)
    try {
      await trocApi.sendProposal(listingId, {
        offered_description: offeredDescription.trim(),
        offered_listing_ids: [],
        offered_photos: [],
        complement_direction: complementDirection,
        complement_xpf: complementDirection === 'none' ? 0 : snapTo10(Number(complementXpf || 0)),
        message: message.trim(),
      })
      setSuccess('Votre proposition a �t� envoy�e.')
      setOfferedDescription('')
      setComplementDirection('none')
      setComplementXpf(0)
      setMessage('')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.75rem] border border-night/8 bg-white p-5 shadow-card">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Proposition structur�e</p>
        <h3 className="mt-2 text-xl font-bold text-night">Proposer un �change pour {listingTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-night/60">
          D�crivez ce que vous offrez avant de d�marrer la discussion. Cest plus clair pour tout le monde.
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="rounded-2xl border border-coral/20 bg-coral/8 p-4 text-sm text-night/70">
          Connectez-vous pour envoyer une proposition. Votre brouillon reste visible ici apr�s connexion.
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-night">Ce que vous proposez *</span>
        <textarea
          value={offeredDescription}
          onChange={(event) => setOfferedDescription(event.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
          placeholder="D�crivez lobjet, l�tat, la marque, les accessoires inclus..."
          maxLength={2000}
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-night">Compl�ment XPF</span>
          <select
            value={complementDirection}
            onChange={(event) => setComplementDirection(event.target.value as 'none' | 'i_pay' | 'they_pay')}
            className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
          >
            <option value="none">Aucun compl�ment</option>
            <option value="i_pay">Je propose un compl�ment</option>
            <option value="they_pay">Je demande un compl�ment</option>
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-night">
            {complementDirection === 'they_pay'
              ? 'Montant demand�'
              : 'Montant propos�'}
          </span>
          <input
            type="number"
            min={0}
            step={10}
            value={complementXpf}
            onChange={(event) => setComplementXpf(Number(event.target.value || 0))}
            onBlur={(event) => setComplementXpf(snapTo10(Number(event.target.value || 0)))}
            disabled={complementDirection === 'none'}
            className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10 disabled:bg-night/5"
            placeholder="0"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-night">Message facultatif</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
          placeholder="Ajoutez une courte note ou une question..."
          maxLength={2000}
        />
      </label>

      {success ? (
        <div className="inline-flex items-center gap-2 rounded-2xl bg-jungle/10 px-4 py-3 text-sm font-medium text-jungle">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-coral/90 disabled:cursor-wait disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {sending ? 'Envoi en cours&' : 'Envoyer ma proposition'}
      </button>
    </form>
  )
}
