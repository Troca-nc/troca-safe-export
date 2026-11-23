import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { publicEventExists } from '@/lib/data/publicEvents'

export default async function PublicEventLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!(await publicEventExists(id))) notFound()

  return children
}
