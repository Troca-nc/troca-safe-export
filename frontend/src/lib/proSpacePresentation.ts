import type {
  ProQuote,
  ProQuoteItem,
  ProQuotePreview,
  ProQuoteRequest,
  ProSpaceProduct,
  QuoteTrackingColumn,
} from '../types/pro-space'

export const LOW_STOCK_THRESHOLD = 5

export function formatXpf(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} XPF`
}

export function calculateQuotePreview(items: ProQuoteItem[], depositPercent: number): ProQuotePreview {
  const lines = items.map((item) => {
    const quantity = Math.round(Math.max(0.001, Number(item.quantity || 0)) * 1000) / 1000
    const unitPrice = Math.max(0, Math.round(Number(item.unit_price_xpf || 0)))
    const subtotal = Math.round(quantity * unitPrice)
    const tgc = Math.round((subtotal * Number(item.tgc_rate || 0)) / 100)
    return { subtotal, tgc }
  })
  const subtotalXpf = lines.reduce((sum, line) => sum + line.subtotal, 0)
  const tgcXpf = lines.reduce((sum, line) => sum + line.tgc, 0)
  const totalXpf = subtotalXpf + tgcXpf
  const safeDeposit = Math.min(100, Math.max(0, Number(depositPercent || 0)))
  const depositXpf = Math.round((totalXpf * safeDeposit) / 100)
  return { subtotalXpf, tgcXpf, totalXpf, depositXpf, balanceXpf: totalXpf - depositXpf }
}

export function isLowStock(product: ProSpaceProduct): boolean {
  return product.stock_quantity !== null && product.stock_quantity <= LOW_STOCK_THRESHOLD
}

export function countManagedStock(products: ProSpaceProduct[]): number {
  return products.filter((product) => product.stock_quantity !== null).length
}

export function quoteTrackingColumn(status: ProQuote['status']): QuoteTrackingColumn | null {
  if (status === 'draft') return 'requests'
  if (status === 'sent' || status === 'viewed') return 'sent'
  if (status === 'accepted' || status === 'converted') return 'accepted'
  if (status === 'paid') return 'paid'
  return null
}

export function trackingCounts(requests: ProQuoteRequest[], quotes: ProQuote[]): Record<QuoteTrackingColumn, number> {
  return quotes.reduce<Record<QuoteTrackingColumn, number>>((counts, quote) => {
    const column = quoteTrackingColumn(quote.status)
    if (column) counts[column] += 1
    return counts
  }, { requests: requests.length, sent: 0, accepted: 0, paid: 0 })
}
