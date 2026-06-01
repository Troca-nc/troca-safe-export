'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'

export default function SetupClient() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Code invalide')
      }
      setMessage('TOTP configuré. Vous pouvez maintenant vous connecter.')
      router.replace('/login')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Code invalide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 flex gap-3">
      <input
        className="admin-input max-w-40 tracking-[0.35em]"
        inputMode="numeric"
        maxLength={6}
        placeholder="123456"
        value={code}
        onChange={(event) => setCode(event.target.value)}
      />
      <button className="admin-button" disabled={loading}>
        {loading ? 'Vérification…' : 'Valider'}
      </button>
      {message ? <p className="w-full text-sm text-slate-300">{message}</p> : null}
    </form>
  )
}
