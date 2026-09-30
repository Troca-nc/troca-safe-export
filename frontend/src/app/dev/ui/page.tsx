import type { Metadata } from 'next'
import { FoundationGallery } from '@/components/ui/FoundationGallery'
export const metadata: Metadata = {
  title: 'Fondations UI — Kalico',
  robots: { index: false, follow: false },
  alternates: { canonical: '/dev/ui' },
}
export default function UiPage() {
  return <FoundationGallery />
}
