'use client'

import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { ChevronLeft, ChevronRight, Download, Maximize2, Minus, Plus, X } from 'lucide-react'

import { usePdfRenderer } from '@/lib/pdfRenderer'

type PdfViewerProps = {
  url: string
  onClose?: () => void
  title?: string
}

export default function PdfViewer({ url, onClose, title = 'Catalogue PDF' }: PdfViewerProps) {
  const { totalPages, currentPage, pageImage, loading, error, zoom, goToPage, nextPage, prevPage, setZoom } = usePdfRenderer(url)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = async () => {
    const element = document.documentElement
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {})
      return
    }
    await element.requestFullscreen?.().catch(() => {})
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current == null) return
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) return
    if (delta < 0) {
      nextPage()
    } else {
      prevPage()
    }
  }

  return (
    <div className={`flex h-full min-h-[70vh] w-full flex-col overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-white shadow-sm ${isFullscreen ? 'rounded-none' : ''}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nc-emeraude">{title}</p>
          <p className="text-sm text-night/55">Page {currentPage} / {totalPages || 0}</p>
        </div>
        <div className="flex items-center gap-2">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] text-night transition hover:bg-[var(--color-background-secondary)]"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[var(--color-border)] px-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
          >
            <Download className="h-4 w-4" />
            T�l�charger
          </a>
          <button
            type="button"
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] text-night transition hover:bg-[var(--color-background-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Page pr�c�dente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] text-night transition hover:bg-[var(--color-background-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex items-center rounded-2xl border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setZoom(zoom - 0.25)}
              className="inline-flex h-10 w-10 items-center justify-center text-night transition hover:bg-[var(--color-background-secondary)]"
              aria-label="R�duire le zoom"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-16 px-2 text-center text-sm font-semibold text-night">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom(zoom + 0.25)}
              className="inline-flex h-10 w-10 items-center justify-center text-night transition hover:bg-[var(--color-background-secondary)]"
              aria-label="Augmenter le zoom"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] text-night transition hover:bg-[var(--color-background-secondary)]"
            aria-label="Plein �cran"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[linear-gradient(180deg,_#f8fafc,_#ffffff)] p-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div className="flex h-72 w-full max-w-3xl animate-pulse items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-sand/40 text-sm text-night/45">
            Chargement du PDF...
          </div>
        ) : error ? (
          <div className="max-w-xl rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-center text-sm text-amber-800">
            <p className="font-semibold">Impossible de charger le PDF.</p>
            <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-2xl bg-[#0A7EA4] px-4 py-2.5 font-semibold text-white">
              T�l�charger le fichier
            </a>
          </div>
        ) : pageImage ? (
          <img
            src={pageImage}
            alt={`Page ${currentPage} du PDF`}
            className="max-h-full max-w-full rounded-[1.25rem] border border-[var(--color-border)] bg-white shadow-lg"
          />
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-white px-6 py-10 text-sm text-night/55">
            Aucun aper�u disponible.
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[var(--color-border)] px-4 py-3">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, index) => {
            const page = index + 1
            const active = page === currentPage
            return (
              <button
                key={page}
                type="button"
                onClick={() => goToPage(page)}
                className={`h-3.5 rounded-full transition ${active ? 'w-8 bg-[#0A7EA4]' : 'w-3.5 bg-night/25 hover:bg-night/40'}`}
                aria-label={`Page ${page}`}
              />
            )
          })}
          {totalPages > 10 ? <span className="ml-1 text-xs font-semibold text-night/40">&</span> : null}
        </div>
      ) : null}
    </div>
  )
}
