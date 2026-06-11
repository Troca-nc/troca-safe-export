'use client'
import { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return
    setStatus('loading')
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          communes: [],
          frequency: 'weekly',
        }),
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p className="mt-3 text-sm font-semibold text-nc-lagon">
        ✅ Vous êtes abonné !
      </p>
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="votre@email.com"
        className="flex-1 rounded-2xl border border-[var(--color-border)]
          bg-[var(--color-background)] px-4 py-2.5 text-sm min-w-0
          text-[var(--color-text-primary)] placeholder:text-night/40
          outline-none focus:border-[#0A7EA4]
          focus:ring-2 focus:ring-[#0A7EA4]/20 transition"
      />
      <button
        onClick={handleSubmit}
        disabled={status === 'loading'}
        className="rounded-2xl bg-[#0A7EA4] px-4 py-2.5
          text-sm font-semibold text-white
          transition hover:bg-[#065f7a] disabled:opacity-60"
      >
        {status === 'loading' ? '...' : "S'abonner"}
      </button>
    </div>
  )
}
