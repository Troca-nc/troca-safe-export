'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import ListingCard from '@/components/listings/ListingCard'
import { API_ORIGIN } from '@/lib/api'
import { normalizeApiOrigin } from '@/lib/apiBase'

export default function TrocListingsPreview() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const baseUrl = normalizeApiOrigin(API_ORIGIN || 'https://kalico-nc.com/api')

    fetch(`${baseUrl}/api/listings?troc=true&limit=4&sort=date`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((json) => {
        setListings(Array.isArray(json?.data) ? json.data : [])
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-night/5" />
        ))}
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-center">
        <p className="font-semibold text-night">Soyez le premier � proposer un troc !</p>
        <p className="mt-2 text-sm text-night/55">
          Publiez une annonce et cochez "Troc possible" pour appara�tre ici.
        </p>
        <Link
          href="/annonces/nouvelle"
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
        >
          Publier une annonce
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      <div className="mt-4 text-center md:hidden">
        <Link href="/troc" className="text-sm font-semibold text-coral hover:underline">
          Voir toutes les annonces troc �
        </Link>
      </div>
    </>
  )
}
