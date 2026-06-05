import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import Header from '@/components/layout/Header'
import { generateNoindexMetadata } from '@/lib/seoHelpers'

import QuotePublicClient from './QuotePublicClient'
import { fetchPublicQuote } from '../publicQuoteData'

export async function generateMetadata(): Promise<Metadata> {
  return generateNoindexMetadata('Devis Troca')
}

export default async function QuotePublicPage(
  { params, searchParams }: {
    params: Promise<{ id: string }>
    searchParams?: Promise<{ token?: string }>
  }
) {
  const { id } = await params
  const token = (await searchParams)?.token
  const quote = await fetchPublicQuote(id, token)

  if (!quote) {
    notFound()
  }

  return (
    <>
      <Header />
      <QuotePublicClient quote={quote} token={token || quote.share_token || ''} />
    </>
  )
}
