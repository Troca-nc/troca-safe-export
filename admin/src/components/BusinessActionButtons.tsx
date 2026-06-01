'use client'

import { useRouter } from 'next/navigation'

async function callAction(path: string) {
  const response = await fetch(path, { method: 'PATCH' })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || 'Action impossible')
  }
  return data
}

export function BusinessActionButtons({ businessId }: { businessId: string }) {
  const router = useRouter()

  const run = async (path: string) => {
    await callAction(path)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => run(`/api/admin/businesses/${businessId}/verify`)} className="admin-button">Vérifier</button>
      <button type="button" onClick={() => run(`/api/admin/businesses/${businessId}/unverify`)} className="admin-button-secondary">Révoquer</button>
    </div>
  )
}
