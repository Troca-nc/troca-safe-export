import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import { generateNoindexMetadata } from '@/lib/seoHelpers'

import QuotePublicLoader from './QuotePublicLoader'

export async function generateMetadata(): Promise<Metadata> {
  return generateNoindexMetadata('Devis Kalico')
}

export default async function QuotePublicPage(
  { params }: {
    params: Promise<{ id: string }>
  }
) {
  const { id } = await params

  return (
    <>
      <Header />
      <QuotePublicLoader quoteId={id} />
    </>
  )
}
