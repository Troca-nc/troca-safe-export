// src/app/page.tsx
import type { Metadata } from 'next'
import { generateHomeMetadata } from '@/lib/seoHelpers'
import HomePage from '@/components/home/HomePage'

export const metadata: Metadata = generateHomeMetadata()

export default function Home() {
  return <HomePage />
}
