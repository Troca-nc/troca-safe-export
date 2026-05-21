'use client'
// ============================================================
//  Troca — Barre de recherche avec autocomplete
//  Suggestions : annonces récentes + catégories + communes
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock, Grid, MapPin, TrendingUp, X } from 'lucide-react'
import { listingsApi } from '@/lib/api'

interface Suggestion {
  type:  'annonce' | 'categorie' | 'commune' | 'historique'
  label: string
  sub?:  string
  href:  string
  icon?: string
}

interface Props {
  placeholder?: string
  className?:   string
  autoFocus?:   boolean
  onSearch?:    (q: string) => void // pour usage dans la page /annonces sans navigation
}

// Historique local (sessionStorage)
const HISTORY_KEY = 'troca_search_history'
const MAX_HISTORY = 5

function getHistory(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch { return [] }
}

function saveHistory(q: string) {
  try {
    const prev = getHistory().filter(h => h !== q)
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify([q, ...prev].slice(0, MAX_HISTORY)))
  } catch {}
}

function clearHistory() {
  try { sessionStorage.removeItem(HISTORY_KEY) } catch {}
}

export default function SearchAutocomplete({ placeholder = 'Rechercher…', className = '', autoFocus, onSearch }: Props) {
  const router    = useRouter()
  const inputRef  = useRef<HTMLInputElement>(null)
  const boxRef    = useRef<HTMLDivElement>(null)
  const listboxId = 'troca-search-suggestions'

  const [q,           setQ]           = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open,        setOpen]        = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [activeIdx,   setActiveIdx]   = useState(-1)
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Suggestions initiales (historique) quand on focus sans texte
  const showHistory = useCallback(() => {
    const hist = getHistory()
    if (!hist.length) return setSuggestions([])
    setSuggestions(hist.map(h => ({
      type:  'historique',
      label:  h,
      href:  `/annonces?q=${encodeURIComponent(h)}`,
    })))
    setOpen(true)
  }, [])

  // Recherche avec debounce
  useEffect(() => {
    if (!q.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      showHistory()
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    setLoading(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await listingsApi.search({ q: q.trim(), limit: 5, sort: 'date' })
        const items: Suggestion[] = []

        // Annonces
        for (const l of data.data ?? []) {
          items.push({
            type:  'annonce',
            label:  l.titre,
            sub:    l.prix ? `${l.prix.toLocaleString('fr-FR')} XPF` : 'Prix libre',
            href:  `/annonces/${l.id}`,
          })
        }

        // Suggestion catégorie si texte > 2 chars
        if (q.length > 2) {
          items.push({
            type:  'categorie',
            label: `Toutes les annonces "${q.trim()}"`,
            href:  `/annonces?q=${encodeURIComponent(q.trim())}`,
          })
        }

        setSuggestions(items)
        setOpen(true)
        setActiveIdx(-1)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q, showHistory])

  // Fermer en cliquant dehors
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const navigate = (href: string, label: string) => {
    saveHistory(label)
    setOpen(false)
    setQ('')
    if (onSearch) onSearch(label)
    else router.push(href)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    saveHistory(q.trim())
    setOpen(false)
    if (onSearch) onSearch(q.trim())
    else router.push(`/annonces?q=${encodeURIComponent(q.trim())}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !suggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      const s = suggestions[activeIdx]
      navigate(s.href, s.label)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const ICONS: Record<string, React.ReactNode> = {
    annonce:    <TrendingUp size={14} className="text-coral shrink-0" />,
    categorie:  <Grid       size={14} className="text-blue-500 shrink-0" />,
    commune:    <MapPin     size={14} className="text-green-500 shrink-0" />,
    historique: <Clock      size={14} className="text-night/30 shrink-0" />,
  }

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search
            size={17}
            className="absolute left-3.5 text-night/35 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="search"
            value={q}
            autoFocus={autoFocus}
            placeholder={placeholder}
            aria-label="Rechercher une annonce, une commune ou une catégorie"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={activeIdx >= 0 ? `${listboxId}-option-${activeIdx}` : undefined}
            role="combobox"
            onChange={e => setQ(e.target.value)}
            onFocus={() => { if (!q) showHistory(); else setOpen(true) }}
            onKeyDown={handleKeyDown}
            className="w-full bg-white border border-night/12 rounded-2xl pl-10 pr-10 py-3 text-sm text-night placeholder:text-night/35 outline-none focus:border-coral/50 focus:ring-2 focus:ring-coral/10 transition-all shadow-sm"
            autoComplete="off"
          />
          {q && (
            <button
              type="button"
              onClick={() => { setQ(''); setSuggestions([]); setOpen(false); inputRef.current?.focus() }}
              className="absolute right-3.5 text-night/30 hover:text-night transition-colors"
              aria-label="Effacer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Suggestions de recherche"
          className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-night/10 rounded-2xl shadow-xl z-50 overflow-hidden"
        >
          {/* Header historique */}
          {!q && suggestions.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-night/6">
              <span className="text-[11px] text-night/40 font-medium uppercase tracking-wide">
                Recherches récentes
              </span>
              <button
                type="button"
                onClick={() => { clearHistory(); setSuggestions([]); setOpen(false) }}
                className="text-[11px] text-night/60 hover:text-coral transition-colors"
              >
                Effacer
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="px-4 py-3 text-sm text-night/60 flex items-center gap-2" aria-live="polite">
              <div className="w-3.5 h-3.5 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
              Recherche…
            </div>
          )}

          {/* Suggestions */}
          {!loading && suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(s.href, s.label)}
              role="option"
              aria-selected={i === activeIdx}
              id={`${listboxId}-option-${i}`}
              aria-label={`${s.label}${s.sub ? `, ${s.sub}` : ''}`}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-sand transition-colors ${
                i === activeIdx ? 'bg-sand' : ''
              }`}
            >
              {ICONS[s.type]}
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-night truncate">
                  {/* Highlight du texte tapé */}
                  {q && s.type !== 'historique'
                    ? highlightMatch(s.label, q)
                    : s.label
                  }
                </span>
                {s.sub && (
                  <span className="text-[11px] text-night/60">{s.sub}</span>
                )}
              </span>
            </button>
          ))}

          {/* Aucun résultat */}
          {!loading && q && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-night/60 text-center" aria-live="polite">
              Aucune suggestion pour « {q} »
            </div>
          )}

          {/* Pied : chercher tout */}
          {q && !loading && (
            <button
              type="button"
              onClick={handleSubmit as any}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-coral font-medium border-t border-night/6 hover:bg-coral/5 transition-colors"
            >
              <Search size={14} />
              Voir tous les résultats pour « {q} »
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Highlight ──────────────────────────────────────────────────
function highlightMatch(text: string, query: string): React.ReactNode {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-coral/15 text-coral rounded px-0.5 not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
