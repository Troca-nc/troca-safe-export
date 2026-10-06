import type { ServicePro, ShippingEstimate } from '@/types/services'

export type ProSort = 'rating' | 'reviews' | 'name'

export function filterAndSortPros(
  pros: ServicePro[],
  filters: { query: string; category: string; commune: string; verifiedOnly: boolean; sort: ProSort },
) {
  const query = filters.query.trim().toLocaleLowerCase('fr-FR')
  return pros
    .filter((pro) => !query || `${pro.name} ${pro.category}`.toLocaleLowerCase('fr-FR').includes(query))
    .filter((pro) => !filters.category || pro.category === filters.category)
    .filter((pro) => !filters.commune || pro.commune === filters.commune)
    .filter((pro) => !filters.verifiedOnly || pro.verified)
    .sort((left, right) => {
      if (filters.sort === 'reviews') return right.reviewCount - left.reviewCount
      if (filters.sort === 'name') return left.name.localeCompare(right.name, 'fr-FR')
      return right.rating - left.rating
    })
}

export function formatXpf(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return 'Tarif sur demande'
  return `${Math.round(value).toLocaleString('fr-FR')} XPF`
}

export function shippingPriceLabel(estimate: ShippingEstimate | null) {
  if (!estimate || estimate.estimatedMinXpf == null || estimate.estimatedMaxXpf == null) {
    return 'Tarif sur demande'
  }
  if (estimate.estimatedMinXpf === estimate.estimatedMaxXpf) return formatXpf(estimate.estimatedMinXpf)
  return `${formatXpf(estimate.estimatedMinXpf)} à ${formatXpf(estimate.estimatedMaxXpf)}`
}
