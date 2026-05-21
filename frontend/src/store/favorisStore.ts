// src/store/favorisStore.ts
// ── Store Zustand pour les favoris — persisté en localStorage ────────────────
// Optimistic UI : le cœur répond instantanément, l'API est appelée en arrière-plan.
// Si l'API échoue, le favori est annulé (rollback).

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { API_ORIGIN } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FavoriItem {
  id:          string
  titre:       string
  prix:        number | null
  cover_image: string | null
  commune:     string | null
  category:    string | null
  savedAt?:    string   // ISO date
}

interface FavorisState {
  ids:     Set<string>          // lookup O(1)
  items:   FavoriItem[]         // liste complète pour la page /favoris
  loading: Set<string>          // annonces en cours de toggle (évite les doubles clics)

  // Actions
  toggle:    (annonce: FavoriItem)  => Promise<void>
  isSaved:   (id: string)           => boolean
  hydrate:   ()                     => Promise<void>  // sync depuis l'API au login
  clear:     ()                     => void           // vider au logout
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useFavorisStore = create<FavorisState>()(
  persist(
    (set, get) => ({
      ids:     new Set<string>(),
      items:   [],
      loading: new Set<string>(),

      // ── isSaved : lecture simple ───────────────────────────────────────────
      isSaved: (id) => get().ids.has(id),

      // ── toggle : optimistic + rollback ────────────────────────────────────
      toggle: async (annonce) => {
        const { ids, items, loading } = get()

        // Éviter les doubles appels simultanés sur la même annonce
        if (loading.has(annonce.id)) return

        const wasSaved   = ids.has(annonce.id)
        const newIds     = new Set(ids)
        const newLoading = new Set(loading)
        newLoading.add(annonce.id)

        // 1. Mise à jour optimiste
        if (wasSaved) {
          newIds.delete(annonce.id)
          set({
            ids:     newIds,
            items:   items.filter(i => i.id !== annonce.id),
            loading: newLoading,
          })
        } else {
          newIds.add(annonce.id)
          set({
            ids:     newIds,
            items:   [{ ...annonce, savedAt: new Date().toISOString() }, ...items],
            loading: newLoading,
          })
        }

        // 2. Appel API
        try {
          if (wasSaved) {
            await axios.delete(`${API_ORIGIN}/api/favoris/${annonce.id}`)
          } else {
            await axios.post(`${API_ORIGIN}/api/favoris`, { annonce_id: annonce.id })
          }
        } catch {
          // 3. Rollback si erreur réseau
          const rollbackIds   = new Set(get().ids)
          const rollbackItems = [...get().items]

          if (wasSaved) {
            rollbackIds.add(annonce.id)
            rollbackItems.unshift({ ...annonce, savedAt: new Date().toISOString() })
          } else {
            rollbackIds.delete(annonce.id)
          }

          set({
            ids:   rollbackIds,
            items: rollbackItems.filter(i => wasSaved ? true : i.id !== annonce.id),
          })
        } finally {
          const done = new Set(get().loading)
          done.delete(annonce.id)
          set({ loading: done })
        }
      },

      // ── hydrate : sync au login depuis l'API ──────────────────────────────
      hydrate: async () => {
        try {
          const { data } = await axios.get(`${API_ORIGIN}/api/favoris`)
          const serverItems: FavoriItem[] = data.data ?? []
          set({
            ids:   new Set(serverItems.map(i => i.id)),
            items: serverItems,
          })
        } catch {
          // Pas critique — on garde le cache local
        }
      },

      // ── clear : vider au logout ────────────────────────────────────────────
      clear: () => set({ ids: new Set(), items: [], loading: new Set() }),
    }),
    {
      name: 'troca-favoris',
      // Sérialiser/désérialiser le Set car JSON ne le supporte pas nativement
      storage: {
        getItem: (key) => {
          const str = localStorage.getItem(key)
          if (!str) return null
          const parsed = JSON.parse(str)
          return {
            ...parsed,
            state: {
              ...parsed.state,
              ids:     new Set(parsed.state.ids     ?? []),
              loading: new Set(parsed.state.loading ?? []),
            },
          }
        },
        setItem: (key, value) => {
          localStorage.setItem(key, JSON.stringify({
            ...value,
            state: {
              ...value.state,
              ids:     [...value.state.ids],
              loading: [],    // ne pas persister le loading
            },
          }))
        },
        removeItem: (key) => localStorage.removeItem(key),
      },
    }
  )
)
