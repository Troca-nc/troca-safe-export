import type { ProSummary } from '@/types/pro-public'

export type ProSort = 'rating' | 'reviews' | 'name'
export type ProFilters = { query: string; category: string; commune: string; minRating: number; sort: ProSort }

export function filterAndSortPros(pros: ProSummary[], filters: ProFilters) {
  const query = filters.query.trim().toLocaleLowerCase('fr-FR')
  return [...pros].filter((pro) => {
    if (filters.category && pro.category !== filters.category) return false
    if (filters.commune && pro.commune !== filters.commune) return false
    if (filters.minRating && pro.rating < filters.minRating) return false
    if (!query) return true
    return [pro.name, pro.companyName, pro.category, pro.commune, pro.description].join(' ').toLocaleLowerCase('fr-FR').includes(query)
  }).sort((left, right) => {
    if (filters.sort === 'reviews') return right.reviewCount - left.reviewCount || right.rating - left.rating
    if (filters.sort === 'name') return left.name.localeCompare(right.name, 'fr-FR')
    return right.rating - left.rating || right.reviewCount - left.reviewCount || left.name.localeCompare(right.name, 'fr-FR')
  })
}

export function uniqueProValues(pros: ProSummary[], key: 'category' | 'commune') {
  return Array.from(new Set(pros.map((pro) => pro[key]).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fr-FR'))
}
