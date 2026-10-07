'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AlertCircle, ArrowUpRight, Boxes, Check, Search, Store } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { countManagedStock, formatXpf, isLowStock } from '@/lib/proSpacePresentation'
import type { ProSpaceData, ProSpaceProduct } from '@/types/pro-space'

type StockFilter = 'all' | 'managed' | 'unmanaged' | 'low'

const filters: Array<{ id: StockFilter; label: string }> = [
  { id: 'all', label: 'Tout' },
  { id: 'managed', label: 'Stock suivi' },
  { id: 'unmanaged', label: 'Stock non suivi' },
  { id: 'low', label: 'Stock faible' },
]

function productMatches(product: ProSpaceProduct, filter: StockFilter) {
  if (filter === 'managed') return product.stock_quantity !== null
  if (filter === 'unmanaged') return product.stock_quantity === null
  if (filter === 'low') return isLowStock(product)
  return true
}

export default function ProShopTab({ data, proId }: { data: ProSpaceData; proId: number }) {
  const [filter, setFilter] = useState<StockFilter>('all')
  const [query, setQuery] = useState('')
  const products = useMemo(() => data.products.filter((product) => {
    const matchesText = product.title.toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr'))
    return matchesText && productMatches(product, filter)
  }), [data.products, filter, query])
  const profileFields = [
    ['Nom', data.profile?.pro_company_name],
    ['Présentation', data.profile?.pro_description],
    ['Logo', data.profile?.pro_logo_url],
    ['Commune', data.profile?.pro_commune],
    ['Téléphone', data.profile?.pro_phone],
    ['Horaires', data.profile?.pro_hours],
  ]

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 hover:border-warm-border"><p className="text-label-sm text-ink/60">Références actives</p><p className="mt-2 font-display text-h3">{data.products.filter((product) => product.is_active).length}</p></Card>
        <Card className="p-5 hover:border-warm-border"><p className="text-label-sm text-ink/60">Stocks suivis</p><p className="mt-2 font-display text-h3">{countManagedStock(data.products)}</p></Card>
        <Card className="p-5 hover:border-warm-border"><p className="text-label-sm text-ink/60">Stocks faibles</p><p className="mt-2 font-display text-h3">{data.products.filter(isLowStock).length}</p></Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <Card className="hover:border-warm-border">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-eyebrow uppercase text-accent-text">Ma boutique</p><h2 className="mt-2 font-display text-h3 font-normal">Catalogue et disponibilité</h2></div>
            <Link href="/pro/dashboard/catalogue" className="k-button k-button-primary">Gérer le catalogue <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Rechercher un produit</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/45" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-12 w-full rounded-field border border-warm-border bg-cream-surface pl-12 pr-4 text-body-sm text-ink outline-none transition focus:border-ink" placeholder="Rechercher dans le catalogue" />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrer le catalogue">
              {filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`min-h-11 shrink-0 rounded-pill border px-4 text-label-sm transition ${filter === item.id ? 'border-ink bg-ink text-cream' : 'border-warm-border bg-cream-surface text-ink hover:border-ink'}`}>{item.label}</button>)}
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {products.map((product) => (
              <article key={product.id} className="grid gap-4 rounded-card border border-warm-border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-h4">{product.title}</h3>{product.is_featured ? <span className="rounded-pill bg-accent-soft px-3 py-1 text-label-sm text-accent-text">Mis en avant</span> : null}</div>
                  <p className="mt-2 text-body-sm text-ink/60">{product.catalog_category_name || 'Sans catégorie'} · {product.published_listing_count} publication{product.published_listing_count > 1 ? 's' : ''}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-label-sm"><span className="rounded-pill bg-info-soft px-3 py-2 text-info-text">{formatXpf(product.price_xpf)}</span><span className={`rounded-pill px-3 py-2 ${isLowStock(product) ? 'bg-alert-warn/10 text-alert-warn' : 'bg-success-soft text-success-text'}`}>{product.stock_quantity === null ? 'Stock non suivi' : `Stock : ${product.stock_quantity}`}</span></div>
                </div>
                <span className={`flex min-h-11 items-center gap-2 rounded-control px-3 text-label-sm ${product.is_available ? 'bg-success-soft text-success-text' : 'bg-alert-error/10 text-alert-error'}`}>{product.is_available ? <Check className="h-4 w-4" aria-hidden="true" /> : <AlertCircle className="h-4 w-4" aria-hidden="true" />}{product.is_available ? 'Disponible' : 'Indisponible'}</span>
              </article>
            ))}
            {!products.length ? <p className="rounded-control bg-cream-sunken p-5 text-body-sm text-ink/65">Aucune référence ne correspond à ces filtres.</p> : null}
          </div>
        </Card>

        <Card className="h-fit hover:border-warm-border">
          <div className="flex items-center justify-between gap-3"><div><p className="text-eyebrow uppercase text-accent-text">Vitrine publique</p><h2 className="mt-2 font-display text-h4">Informations visibles</h2></div><Store className="h-6 w-6 text-info-text" aria-hidden="true" /></div>
          {data.profileUnavailable ? <FeedbackAlert className="mt-5">La vitrine publique n’est pas encore accessible. Les informations de session restent inchangées.</FeedbackAlert> : (
            <ul className="mt-5 grid gap-3">{profileFields.map(([label, value]) => <li key={label} className="flex min-h-11 items-center justify-between gap-3 rounded-control bg-cream-sunken px-4 text-body-sm"><span>{label}</span><span className={value ? 'text-success-text' : 'text-ink/45'}>{value ? 'Renseigné' : 'À compléter'}</span></li>)}</ul>
          )}
          <div className="mt-5 grid gap-3"><Link href={`/pro/${proId}`} className="k-button k-button-secondary">Voir ma vitrine</Link><Link href="/pro/dashboard/parametres" className="k-button k-button-tertiary">Modifier mes informations</Link></div>
          <div className="mt-6 rounded-control bg-info-soft p-4 text-body-sm text-info-text"><div className="flex gap-3"><Boxes className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>Un stock non suivi reste disponible sans quantité. Les produits à zéro sont signalés comme indisponibles par le serveur.</p></div></div>
        </Card>
      </section>
    </div>
  )
}
