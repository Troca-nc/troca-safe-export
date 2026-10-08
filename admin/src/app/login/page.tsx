'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { ShieldCheck, KeyRound, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, totp }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Connexion impossible')
      }
      router.replace('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <section className="admin-card w-full border-t-4 border-t-[var(--admin-orange)]">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[var(--admin-ink)] p-3 text-[var(--admin-ivory)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="admin-kicker">Admin sécurisé</p>
            <h1 className="admin-section-title mt-1">Connexion Kalico</h1>
          </div>
        </div>


        <form className="mt-8 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="admin-label">Email</span>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-ink-soft)]" />
              <input className="admin-input pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </label>

          <label className="block">
            <span className="admin-label">Mot de passe</span>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-ink-soft)]" />
              <input type="password" className="admin-input pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </label>

          <label className="block">
            <span className="admin-label">Code TOTP</span>
            <div className="relative mt-2">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-ink-soft)]" />
              <input inputMode="numeric" maxLength={6} className="admin-input pl-10 tracking-[0.35em]" value={totp} onChange={(e) => setTotp(e.target.value)} />
            </div>
          </label>

          {error ? <p className="rounded-md border border-[var(--admin-red)]/35 bg-[var(--admin-red)]/10 px-4 py-3 text-sm text-[var(--admin-red-dark)]">{error}</p> : null}

          <button disabled={loading} className="admin-button w-full disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="admin-muted mt-5 text-sm">
          Le provisionnement initial est réalisé hors ligne par un opérateur autorisé.
        </p>
      </section>
    </main>
  )
}
