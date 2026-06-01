'use client'

import { useRouter } from 'next/navigation'

async function callAction(path: string, payload: Record<string, unknown> = {}) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || 'Action impossible')
  }
  return data
}

export function UserActionButtons({ userId }: { userId: string }) {
  const router = useRouter()

  const run = async (path: string, payload: Record<string, unknown> = {}) => {
    await callAction(path, payload)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={() => run(`/api/admin/users/${userId}/suspend`, { reason: 'admin', duration_days: 30 })} className="admin-button-secondary">Suspendre</button>
      <button type="button" onClick={() => run(`/api/admin/users/${userId}/unsuspend`)} className="admin-button-secondary">Réactiver</button>
      <button type="button" onClick={() => run(`/api/admin/users/${userId}/set-plan`, { plan: 'pro' })} className="admin-button">Passer Pro</button>
      <button type="button" onClick={() => run(`/api/admin/users/${userId}/set-plan`, { plan: 'free' })} className="admin-button-secondary">Passer Gratuit</button>
      <button type="button" onClick={() => run(`/api/admin/users/${userId}/force-delete`)} className="admin-button-secondary">Supprimer</button>
    </div>
  )
}
