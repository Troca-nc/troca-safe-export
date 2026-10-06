'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Briefcase, FilterX, RefreshCw, Search, ShieldCheck } from 'lucide-react'

import ProCard from '@/components/pro/ProCard'
import { Button } from '@/components/ui/Button'
import { Card, DeepPanel } from '@/components/ui/Card'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { Input, Select } from '@/components/ui/Field'
import { getProsDirectory } from '@/lib/data/pros'
import { filterAndSortPros, uniqueProValues, type ProSort } from '@/lib/prosPresentation'
import type { ProSummary } from '@/types/pro-public'

function DirectorySkeleton() {
  return <div className="overflow-hidden rounded-card border border-sand bg-cream-surface shadow-card"><div className="h-[88px] animate-pulse bg-cream-sunken" /><div className="space-y-4 p-5"><div className="h-14 w-14 -translate-y-10 animate-pulse rounded-full bg-sand" /><div className="h-6 w-2/3 animate-pulse rounded-pill bg-sand" /><div className="h-20 animate-pulse rounded-control bg-cream-sunken" /></div></div>
}

export default function ProsDirectoryView() {
  const [pros, setPros] = useState<ProSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [commune, setCommune] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [sort, setSort] = useState<ProSort>('rating')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setPros(await getProsDirectory()) }
    catch { setPros([]); setError("L'annuaire ne peut pas être chargé pour le moment.") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const categories = useMemo(() => uniqueProValues(pros, 'category'), [pros])
  const communes = useMemo(() => uniqueProValues(pros, 'commune'), [pros])
  const visiblePros = useMemo(() => filterAndSortPros(pros, { query, category, commune, minRating, sort }), [pros, query, category, commune, minRating, sort])
  const hasFilters = Boolean(query || category || commune || minRating)
  const reset = () => { setQuery(''); setCategory(''); setCommune(''); setMinRating(0); setSort('rating') }

  return (
    <main className="bg-cream text-ink">
      <section className="mx-auto max-w-site px-4 py-6 sm:px-6 sm:py-10">
        <DeepPanel className="p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <p className="text-label-sm font-semibold uppercase tracking-label text-accent">Annuaire des professionnels</p>
              <h1 className="mt-3 max-w-3xl font-display text-h2 font-normal text-cream sm:text-display-sm">Trouvez le bon professionnel, près de chez vous</h1>
              <p className="mt-4 max-w-2xl text-body text-cream/75">Comparez les métiers, les avis et les vitrines de professionnels actifs et vérifiés en Nouvelle-Calédonie.</p>
            </div>
            <div className="grid gap-3">
              <Link href="/appels-offres" className="k-button k-button-primary"><span className="flex items-center justify-center gap-2"><Briefcase className="h-4 w-4" aria-hidden="true" />Publier un besoin</span></Link>
              <Link href="/pro" className="k-button k-button-ghost"><span className="flex items-center justify-center gap-2"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Découvrir l'offre Pro</span></Link>
            </div>
          </div>
        </DeepPanel>
      </section>

      <section className="mx-auto max-w-site px-4 pb-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[296px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="hover:border-sand">
              <div className="flex items-center justify-between gap-3"><div><p className="text-label-sm font-semibold uppercase tracking-label text-lagoon-text">Filtres</p><h2 className="mt-1 font-display text-h5 font-semibold">Affiner la recherche</h2></div>{hasFilters ? <Button variant="tertiary" compact onClick={reset} aria-label="Réinitialiser les filtres"><FilterX className="h-4 w-4" aria-hidden="true" /></Button> : null}</div>
              <div className="mt-5 grid gap-4">
                <Input label="Recherche" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, métier..." />
                <Select label="Métier" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Tous les métiers</option>{categories.map((value) => <option key={value}>{value}</option>)}</Select>
                <Select label="Commune" value={commune} onChange={(event) => setCommune(event.target.value)}><option value="">Toutes les communes</option>{communes.map((value) => <option key={value}>{value}</option>)}</Select>
                <Select label="Note minimum" value={String(minRating)} onChange={(event) => setMinRating(Number(event.target.value))}><option value="0">Toutes les notes</option><option value="4">4 et plus</option><option value="4.5">4,5 et plus</option></Select>
              </div>
              <p className="mt-5 border-t border-sand pt-4 text-caption text-ink/60">Les résultats publics contiennent uniquement des professionnels actifs et vérifiés.</p>
            </Card>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-label-sm font-semibold uppercase tracking-label text-lagoon-text">Professionnels vérifiés</p><h2 className="mt-1 font-display text-h4 font-semibold">{loading ? 'Chargement...' : `${visiblePros.length} résultat${visiblePros.length > 1 ? 's' : ''}`}</h2></div>
              <label className="flex items-center gap-3 text-body-sm font-semibold"><span>Trier par</span><select className="k-filter" value={sort} onChange={(event) => setSort(event.target.value as ProSort)}><option value="rating">Meilleures notes</option><option value="reviews">Nombre d'avis</option><option value="name">Nom</option></select></label>
            </div>

            {error ? <FeedbackAlert tone="error" title="Chargement impossible"><span>{error}</span><Button variant="secondary" compact className="mt-3" onClick={() => void load()}><RefreshCw className="h-4 w-4" aria-hidden="true" />Réessayer</Button></FeedbackAlert> : null}
            {loading ? <div className="grid gap-5 xl:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <DirectorySkeleton key={index} />)}</div> : null}
            {!loading && !error && visiblePros.length ? <div className="grid gap-5 xl:grid-cols-2">{visiblePros.map((pro) => <ProCard key={pro.id} pro={pro} />)}</div> : null}
            {!loading && !error && !visiblePros.length ? (
              <Card className="py-12 text-center hover:border-sand"><Search className="mx-auto h-8 w-8 text-lagoon-text" aria-hidden="true" /><h3 className="mt-4 font-display text-h5 font-semibold">Aucun professionnel dans cette sélection</h3><p className="mx-auto mt-2 max-w-md text-body-sm text-ink/70">Élargissez la recherche ou retirez un filtre pour voir davantage de vitrines.</p><Button variant="secondary" className="mt-5" onClick={reset}>Effacer les filtres</Button></Card>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
