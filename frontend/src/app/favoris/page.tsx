'use client'
// src/app/favoris/page.tsx
// ── Page favoris — liste des annonces sauvegardées ───────────────────────────

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart, Trash2, Search, SlidersHorizontal,
  ArrowUpDown, MapPin, Clock, Grid2X2, List,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Header from '@/components/layout/Header'
import { useFavorisStore } from '@/store/favorisStore'
import { useAuthStore }    from '@/store/authStore'
import { useFavorite } from '@/hooks/useFavorite'

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = 'savedAt_desc' | 'savedAt_asc' | 'prix_asc' | 'prix_desc'
type ViewMode = 'grid' | 'list'

// ── Carte favori en vue liste ─────────────────────────────────────────────────

function FavoriListItem({
  item, onRemove,
}: {
  item: ReturnType<typeof useFavorisStore.getState>['items'][0]
  onRemove: () => void
}) {
  const savedAgo = formatDistanceToNow(new Date(item.savedAt), { locale: fr, addSuffix: true })

  return (
    <div className="card flex gap-4 p-4 group hover:shadow-md transition-shadow">
      {/* Image */}
      <Link href={`/annonces/${item.id}`} className="shrink-0">
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-sand">
          {item.cover_image ? (
            <img src={item.cover_image} alt={item.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">📦</div>
          )}
        </div>
      </Link>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <Link href={`/annonces/${item.id}`}>
          <h3 className="font-medium text-night text-sm leading-tight line-clamp-2 hover:text-coral transition-colors mb-1.5">
            {item.titre}
          </h3>
        </Link>

        <p className="font-bold text-night text-base mb-2">
          {item.prix
            ? <>{item.prix.toLocaleString('fr-FR')} <span className="text-sm font-normal text-night/50">XPF</span></>
            : <span className="text-night/40 italic text-sm">Prix à débattre</span>
          }
        </p>

        <div className="flex items-center gap-3 text-xs text-night/40">
          {item.commune && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />{item.commune}
            </span>
          )}
          {item.category && (
            <span className="bg-sand px-2 py-0.5 rounded-full">{item.category}</span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" />Sauvegardé {savedAgo}
          </span>
        </div>
      </div>

      {/* Supprimer */}
      <button
        onClick={onRemove}
        className="shrink-0 self-start p-1.5 text-night/25 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        aria-label="Retirer des favoris"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyFavoris({ filtered }: { filtered: boolean }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-coral/10 rounded-full flex items-center justify-center mx-auto mb-5">
        <Heart className="w-9 h-9 text-coral/50" />
      </div>
      <h2 className="font-display font-bold text-xl text-night mb-2">
        {filtered ? 'Aucun favori correspondant' : 'Aucun favori sauvegardé'}
      </h2>
      <p className="text-night/50 text-sm mb-6 max-w-xs mx-auto">
        {filtered
          ? 'Essayez de modifier votre recherche ou vos filtres.'
          : 'Appuyez sur le ❤️ d\'une annonce pour la retrouver ici à tout moment.'
        }
      </p>
      {!filtered && (
        <Link href="/annonces" className="btn-primary px-6 py-2.5">
          Parcourir les annonces
        </Link>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function FavorisPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { items } = useFavorisStore()
  const { toggleFavorite } = useFavorite()

  const [search,   setSearch]   = useState('')
  const [sort,     setSort]     = useState<SortKey>('savedAt_desc')
  const [view,     setView]     = useState<ViewMode>('grid')
  const [removing, setRemoving] = useState<Set<string>>(new Set())

  // Rediriger si non connecté
  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="font-display font-bold text-2xl text-night mb-2">Connexion requise</h1>
          <p className="text-night/50 text-sm mb-6">Connectez-vous pour retrouver vos annonces sauvegardées.</p>
          <Link href="/connexion?redirect=/favoris" className="btn-primary px-6 py-2.5">
            Se connecter
          </Link>
        </div>
      </>
    )
  }

  // ── Filtrage + tri ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...items]

    // Recherche textuelle
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(i =>
        i.titre.toLowerCase().includes(q) ||
        i.commune?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      )
    }

    // Tri
    result.sort((a, b) => {
      switch (sort) {
        case 'savedAt_desc': return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        case 'savedAt_asc':  return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
        case 'prix_asc':     return (a.prix ?? Infinity) - (b.prix ?? Infinity)
        case 'prix_desc':    return (b.prix ?? 0) - (a.prix ?? 0)
        default: return 0
      }
    })

    return result
  }, [items, search, sort])

  // ── Suppression avec animation ──────────────────────────────────────────────
  const handleRemove = async (item: typeof items[0]) => {
    setRemoving(prev => new Set(prev).add(item.id))
    await new Promise(r => setTimeout(r, 200)) // micro-délai pour l'animation
    await toggleFavorite({
      id: item.id,
      titre: item.titre,
      prix: item.prix,
      cover_image: item.cover_image,
      commune: item.commune,
      category: item.category,
    })
    setRemoving(prev => { const s = new Set(prev); s.delete(item.id); return s })
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

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl text-night flex items-center gap-2">
              <Heart className="w-6 h-6 text-coral fill-coral" />
              Mes favoris
            </h1>
            <p className="text-night/50 text-sm mt-0.5">
              {items.length} annonce{items.length > 1 ? 's' : ''} sauvegardée{items.length > 1 ? 's' : ''}
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={handleRemoveAll}
              className="flex items-center gap-1.5 text-xs text-night/40 hover:text-red-500 transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Tout supprimer
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyFavoris filtered={false} />
        ) : (
          <>
            {/* Barre de contrôles */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Recherche */}
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night/35" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher dans mes favoris…"
                  className="input pl-9 py-2 text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-night/30 hover:text-night/60"
                  >×</button>
                )}
              </div>

              {/* Tri */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortKey)}
                  className="input py-2 text-sm pl-9 pr-8 appearance-none cursor-pointer"
                >
                  <option value="savedAt_desc">Plus récents</option>
                  <option value="savedAt_asc">Plus anciens</option>
                  <option value="prix_asc">Prix croissant</option>
                  <option value="prix_desc">Prix décroissant</option>
                </select>
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night/35 pointer-events-none" />
              </div>

              {/* Vue grille / liste */}
              <div className="flex rounded-xl border border-night/12 overflow-hidden">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 transition-colors ${view === 'grid' ? 'bg-coral text-white' : 'text-night/40 hover:bg-sand'}`}
                  aria-label="Vue grille"
                >
                  <Grid2X2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 transition-colors ${view === 'list' ? 'bg-coral text-white' : 'text-night/40 hover:bg-sand'}`}
                  aria-label="Vue liste"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Compteur filtré */}
              {search && (
                <p className="text-sm text-night/50">
                  {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Contenu */}
            {filtered.length === 0 ? (
              <EmptyFavoris filtered={true} />
            ) : view === 'grid' ? (
              // Vue grille — réutilise ListingCard avec les données du store
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map(item => (
                  <div
                    key={item.id}
                    className={`transition-all duration-200 ${removing.has(item.id) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                  >
                    <Link href={`/annonces/${item.id}`} className="card block overflow-hidden group">
                      <div className="relative aspect-[4/3] bg-sand overflow-hidden">
                        {item.cover_image ? (
                          <img src={item.cover_image} alt={item.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">📦</div>
                        )}
                        {/* Bouton retirer */}
                        <button
                          onClick={e => { e.preventDefault(); handleRemove(item) }}
                          className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                          aria-label="Retirer des favoris"
                        >
                          <Heart className="w-4 h-4 fill-coral text-coral" />
                        </button>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-night text-sm leading-tight line-clamp-2 mb-1.5 group-hover:text-coral transition-colors">
                          {item.titre}
                        </h3>
                        <p className="font-bold text-night text-base">
                          {item.prix
                            ? <>{item.prix.toLocaleString('fr-FR')} <span className="text-sm font-normal text-night/50">XPF</span></>
                            : <span className="text-night/40 italic text-sm">Prix à débattre</span>
                          }
                        </p>
                        {item.commune && (
                          <p className="flex items-center gap-1 text-xs text-night/40 mt-1.5">
                            <MapPin className="w-3 h-3" />{item.commune}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              // Vue liste
              <div className="space-y-3">
                {filtered.map(item => (
                  <div
                    key={item.id}
                    className={`transition-all duration-200 ${removing.has(item.id) ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}`}
                  >
                    <FavoriListItem
                      item={item}
                      onRemove={() => handleRemove(item)}
                    />
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
