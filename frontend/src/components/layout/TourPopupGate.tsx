'use client'

import TourPopup from '@/components/TourPopup'
import { useAuthSessionSync } from '@/hooks/useAuthSessionSync'

export default function TourPopupGate() {
  const { user, authReady } = useAuthSessionSync()

  if (!authReady) return null

  const accountType = user?.is_pro || user?.account_type === 'professional' ? 'pro' : 'particulier'

  return (
    <TourPopup
      accountType={accountType}
      proCategory={user?.pro_category ?? undefined}
      seenFromBackend={user?.tours_seen ?? undefined}
    />
  )
}
