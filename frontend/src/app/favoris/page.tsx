'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowUpDown, Clock, Grid2X2, Heart, List, MapPin, Search, Trash2 } from 'lucide-react'

import Header from '@/components/layout/Header'
import { useFavorite } from '@/hooks/useFavorite'
import { useFavorisStore } from '@/store/favorisStore'
import { useAuthStore } from '@/store/authStore'

type SortKey = 'savedAt_desc' | 'savedAt_asc' | 'prix_asc' | 'prix_desc'
type ViewMode = 'grid' | 'list'

function FavoriListItem({
  item,
  onRemove,
}: {
  item: ReturnType<typeof useFavorisStore.getState>['items'][0]
  onRemove: () => void
}) {
  const savedAgo = item.savedAt
    ? formatDistanceToNow(new Date(item.savedAt), { locale: fr, addSuffix: true })
    : 'récemment'

  return (
    <div className="group flex gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/annonces/${item.id}`} className="shrink-0">
        <div className="h-24 w-24 overflow-hidden rounded-xl bg-sand">
          {item.cover_image ? (
            <img
              src={item.cover_image}
              alt={item.titre}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl opacity-30">📦</div>
          )}
        </div>
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/annonces/${item.id}`}>
          <h3 className="mb-1.5 line-clamp-2 text-sm font-medium leading-tight text-night transition-colors hover:text-coral">
            {item.titre}
          </h3>
        </Link>

        <p className="mb-2 text-base font-bold text-night">
          {item.prix ? (
            <>
              {item.prix.toLocaleString('fr-FR')}{' '}
              <span className="text-sm font-normal text-night/50">XPF</span>
            </>
          ) : (
            <span className="text-sm italic text-night/40">Prix à débattre</span>
          )}
        </p>

        <div className="flex items-center gap-3 text-xs text-night/40">
          {item.commune ? (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {item.commune}
            </span>
          ) : null}
          {item.category ? (
            <span className="rounded-full bg-sand px-2 py-0.5">{item.category}</span>
          ) : null}
          <span className="ml-auto flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Sauvegardé {savedAgo}
          </span>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="shrink-0 self-start rounded-lg p-1.5 text-night/25 transition-all hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
        aria-label="Retirer des favoris"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function EmptyFavoris({
  filtered,
  isGuest,
}: {
  filtered: boolean
  isGuest: boolean
}) {
  return (
    <div className="py-20 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-coral/10">
        <Heart className="h-9 w-9 text-coral/50" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-night font-display">
        {filtered ? 'Aucun favori correspondant' : 'Aucun favori sauvegardé'}
      </h2>
      <p className="mx-auto mb-6 max-w-xs text-sm text-night/50">
        {filtered
          ? 'Essayez de modifier votre recherche ou vos filtres.'
          : isGuest
            ? 'Sauvegardez vos annonces préférées puis créez un compte pour les retrouver sur tous vos appareils.'
            : "Appuyez sur le ❤ d'une annonce pour la retrouver ici à tout moment."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/annonces" className="btn-primary px-6 py-2.5">
          Parcourir les annonces
        </Link>
        {isGuest ? (
          <Link href="/inscription?redirect=/favoris" className="rounded-2xl border border-[var(--color-border)] px-6 py-2.5 text-sm font-semibold text-night transition hover:bg-night/5">
            Créer un compte
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export default function FavorisPage() {
  const { items } = useFavorisStore()
  const { isAuthenticated } = useAuthStore()
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const { toggleFavorite } = useFavorite()

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('savedAt_desc')
  const [view, setView] = useState<ViewMode>('grid')
  const [removing, setRemoving] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let result = [...items]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (item) =>
          item.titre.toLowerCase().includes(q)
          || item.commune?.toLowerCase().includes(q)
          || item.category?.toLowerCase().includes(q),
      )
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'savedAt_desc':
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        case 'savedAt_asc':
          return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
        case 'prix_asc':
          return (a.prix ?? Infinity) - (b.prix ?? Infinity)
        case 'prix_desc':
          return (b.prix ?? -Infinity) - (a.prix ?? -Infinity)
        default:
          return 0
      }
    })

    return result
  }, [items, search, sort])

  const handleRemove = async (item: typeof items[0]) => {
    setRemoving((prev) => new Set(prev).add(item.id))
    await new Promise((resolve) => setTimeout(resolve, 200))
    await toggleFavorite({
      id: item.id,
      titre: item.titre,
      prix: item.prix,
      cover_image: item.cover_image,
      commune: item.commune,
      category: item.category,
    })
    setRemoving((prev) => {
      const next = new Set(prev)
      next.delete(item.id)
      return next
    })
  }

  const handleRemoveAll = async () => {
    if (!confirm(`Supprimer les ${items.length} favoris ?`)) return
    for (const item of items) {
      await toggleFavorite({
        id: item.id,
        titre: item.titre,
        prix: item.prix,
        cover_image: item.cover_image,
        commune: item.commune,
        category: item.category,
      })
    }
  }

  if (!hasHydrated) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
          <div className="skeleton h-10 w-48 rounded-full" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton h-44 rounded-[1.5rem]" />
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {!isAuthenticated ? (
          <div className="mb-6 rounded-[2rem] border border-[#0A7EA4]/15 bg-nc-lagonLight p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-lagon">Vos favoris sont là</p>
            <h2 className="mt-1 text-2xl font-bold text-night font-display">
              Consultez et préparez vos favoris avant de créer un compte
            </h2>
            <p className="mt-1 text-sm text-night/55">
              Vos annonces sauvegardées restent visibles ici. Créez un compte pour les synchroniser sur tous vos appareils.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/inscription?redirect=/favoris" className="btn-primary rounded-2xl px-4 py-2.5 text-sm">
                Créer un compte
              </Link>
              <Link href="/connexion?redirect=/favoris" className="btn-secondary rounded-2xl px-4 py-2.5 text-sm">
                Se connecter
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-night font-display">
              <Heart className="h-6 w-6 fill-coral text-coral" />
              Mes favoris
            </h1>
            <p className="mt-0.5 text-sm text-night/50">
              {items.length} annonce{items.length > 1 ? 's' : ''} sauvegardée{items.length > 1 ? 's' : ''}
            </p>
          </div>

          {items.length > 0 ? (
            <button
              onClick={handleRemoveAll}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-night/40 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Tout supprimer
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <EmptyFavoris filtered={false} isGuest={!isAuthenticated} />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="relative min-w-48 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher dans mes favoris…"
                  className="input py-2 pl-9 text-sm"
                />
                {search ? (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-night/30 hover:text-night/60"
                  >
                    ×
                  </button>
                ) : null}
              </div>

              <div className="relative">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="input cursor-pointer appearance-none py-2 pl-9 pr-8 text-sm"
                >
                  <option value="savedAt_desc">Plus récents</option>
                  <option value="savedAt_asc">Plus anciens</option>
                  <option value="prix_asc">Prix croissant</option>
                  <option value="prix_desc">Prix décroissant</option>
                </select>
                <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
              </div>

              <div className="flex overflow-hidden rounded-xl border border-night/12">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 transition-colors ${view === 'grid' ? 'bg-coral text-white' : 'text-night/40 hover:bg-sand'}`}
                  aria-label="Vue grille"
                >
                  <Grid2X2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 transition-colors ${view === 'list' ? 'bg-coral text-white' : 'text-night/40 hover:bg-sand'}`}
                  aria-label="Vue liste"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {search ? (
                <p className="text-sm text-night/50">
                  {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                </p>
              ) : null}
            </div>

            {filtered.length === 0 ? (
              <EmptyFavoris filtered isGuest={!isAuthenticated} />
            ) : view === 'grid' ? (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className={`transition-all duration-200 ${removing.has(item.id) ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
                  >
                    <Link href={`/annonces/${item.id}`} className="group block overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                        {item.cover_image ? (
                          <img
                            src={item.cover_image}
                            alt={item.titre}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl opacity-30">📦</div>
                        )}
                        <button
                          onClick={(event) => {
                            event.preventDefault()
                            handleRemove(item)
                          }}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-110"
                          aria-label="Retirer des favoris"
                        >
                          <Heart className="h-4 w-4 fill-coral text-coral" />
                        </button>
                      </div>
                      <div className="p-3">
                        <h3 className="mb-1.5 line-clamp-2 text-sm font-medium leading-tight text-night transition-colors group-hover:text-coral">
                          {item.titre}
                        </h3>
                        <p className="text-base font-bold text-night">
                          {item.prix ? (
                            <>
                              {item.prix.toLocaleString('fr-FR')}{' '}
                              <span className="text-sm font-normal text-night/50">XPF</span>
                            </>
                          ) : (
                            <span className="text-sm italic text-night/40">Prix à débattre</span>
                          )}
                        </p>
                        {item.commune ? (
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-night/40">
                            <MapPin className="h-3 w-3" />
                            {item.commune}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className={`transition-all duration-200 ${removing.has(item.id) ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}`}
                  >
                    <FavoriListItem item={item} onRemove={() => handleRemove(item)} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
