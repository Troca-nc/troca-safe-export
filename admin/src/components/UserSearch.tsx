'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'

export function UserSearch({ initialValue = '' }: { initialValue?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialValue)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (value.trim()) params.set('search', value.trim())
    else params.delete('search')
    router.replace(`/users?${params.toString()}`)
  }

  return (
    <form onSubmit={submit} className="flex gap-3">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className="admin-input pl-10"
          placeholder="Rechercher un utilisateur"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      <button className="admin-button">Rechercher</button>
    </form>
  )
}
