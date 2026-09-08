'use client'

import { useEffect, useRef, useState } from 'react'

import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { proQuotesApi } from '@/lib/api'
import { consumeCapabilityTokenFromFragment } from '@/lib/capabilityToken'
import type { PublicQuote } from '../publicQuoteData'
import QuotePublicClient from './QuotePublicClient'

export default function QuotePublicLoader({ quoteId }: { quoteId: string }) {
  const [quote, setQuote] = useState<PublicQuote | null>(null)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const capability = consumeCapabilityTokenFromFragment() || ''
    setToken(capability)
    proQuotesApi.getById(quoteId, capability || undefined)
      .then((response) => setQuote(response.data?.data || null))
      .catch(() => setError('Ce devis est introuvable ou le lien a expiré.'))
  }, [quoteId])

  if (error) return <main className="mx-auto max-w-3xl px-4 py-8"><FeedbackAlert tone="error" title="Accès impossible">{error}</FeedbackAlert></main>
  if (!quote) return <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-night/60">Chargement du devis…</main>
  return <QuotePublicClient quote={quote} token={token} />
}
