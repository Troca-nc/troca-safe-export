import { cache } from 'react'

import { DEMO } from '@/lib/demo'
import { serverPublicFetch } from '@/lib/serverPublicApi'

export const publicEventExists = cache(async (id: string) => {
  if (DEMO) {
    const [{ managedEventDraftFixture }, { bonsPlansPageFixture }] = await Promise.all([
      import('@/demo/fixtures/events'),
      import('@/demo/fixtures/bon-plans'),
    ])
    return managedEventDraftFixture.id === id
      || bonsPlansPageFixture.events.some((event) => event.id === id)
  }

  const response = await serverPublicFetch(`/events/${encodeURIComponent(id)}`, {
    next: { revalidate: 60 },
  })
  if (response.status === 404) return false
  if (!response.ok) throw new Error(`Event request failed with status ${response.status}`)
  return true
})
