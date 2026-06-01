'use client'

import { Suspense } from 'react'
import MessagesPage from '@/components/messages/MessagesPage'

export default function MessagesRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <MessagesPage />
    </Suspense>
  )
}
