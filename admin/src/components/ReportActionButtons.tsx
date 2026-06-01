'use client'

import { useRouter } from 'next/navigation'

async function resolveReport(reportId: string, action: 'dismiss' | 'remove_content' | 'suspend_user') {
  const response = await fetch(`/api/admin/moderation/reports/${reportId}/resolve`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || 'Action impossible')
  }
  return data
}

export function ReportActionButtons({ reportId }: { reportId: string }) {
  const router = useRouter()

  const run = async (action: 'dismiss' | 'remove_content' | 'suspend_user') => {
    await resolveReport(reportId, action)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => run('dismiss')} className="admin-button-secondary">Garder</button>
      <button type="button" onClick={() => run('remove_content')} className="admin-button">Supprimer contenu</button>
      <button type="button" onClick={() => run('suspend_user')} className="admin-button-secondary">Suspendre</button>
    </div>
  )
}
