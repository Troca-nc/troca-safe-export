'use client'

import { Suspense } from 'react'
import MessagesPageV2 from '@/components/messages/MessagesPageV2'

export default function MessagesRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <MessagesPageV2 />
    </Suspense>
  )
}
