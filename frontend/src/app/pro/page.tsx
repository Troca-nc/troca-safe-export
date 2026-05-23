'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProLegacyPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/abonnement')
  }, [router])

  return null
}
