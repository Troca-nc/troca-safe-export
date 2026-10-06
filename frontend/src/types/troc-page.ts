export type TrocListing = {
  id: string
  title: string
  valueXpf: number
  sellerName: string
  commune: string
  condition: string
  category: string
  categorySlug: string
  wants: string[]
  wish: string
  acceptsComplement: boolean
  complementMaxXpf: number
  compatibilityScore: number | null
  coverImage: string | null
}

export type TrocPageData = {
  listings: TrocListing[]
  myListings: TrocListing[]
  total: number
}

export type TrocProposalInput = {
  targetListingId: string
  offeredListingId: string
  complementXpf: number
  complementDirection: 'none' | 'i_pay' | 'they_pay'
  message?: string
}
