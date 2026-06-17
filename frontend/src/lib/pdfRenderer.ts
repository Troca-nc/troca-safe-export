'use client'

import { useEffect, useMemo, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}

type PdfRendererState = {
  totalPages: number
  currentPage: number
  pageImage: string | null
  loading: boolean
  error: string | null
  zoom: number
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setZoom: (zoom: number) => void
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2

function clamp(value: number, min = MIN_ZOOM, max = MAX_ZOOM) {
  return Math.max(min, Math.min(max, value))
}

export function usePdfRenderer(url?: string | null): PdfRendererState {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageImage, setPageImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoomState] = useState(1)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!url) {
        setPdfDoc(null)
        setPageImage(null)
        setTotalPages(0)
        setCurrentPage(1)
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const doc = await pdfjsLib.getDocument({ url }).promise
        if (cancelled) return
        setPdfDoc(doc)
        setTotalPages(doc.numPages)
        setCurrentPage(1)
      } catch (err) {
        if (cancelled) return
        setPdfDoc(null)
        setTotalPages(0)
        setPageImage(null)
        setError('Impossible de charger le PDF.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [url])

  useEffect(() => {
    let cancelled = false

    const renderPage = async () => {
      if (!pdfDoc || currentPage < 1 || currentPage > totalPages) {
        setPageImage(null)
        return
      }

      try {
        const page = await pdfDoc.getPage(currentPage)
        if (cancelled) return
        const viewport = page.getViewport({ scale: clamp(zoom) })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) {
          throw new Error('Canvas indisponible')
        }

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise

        if (cancelled) return
        setPageImage(canvas.toDataURL('image/png'))
      } catch {
        if (!cancelled) {
          setError('Impossible de rendre la page du PDF.')
          setPageImage(null)
        }
      }
    }

    void renderPage()

    return () => {
      cancelled = true
    }
  }, [currentPage, pdfDoc, totalPages, zoom])

  const goToPage = useMemo(() => (page: number) => {
    if (!totalPages) return
    setCurrentPage(Math.max(1, Math.min(totalPages, Math.round(page))))
  }, [totalPages])

  const nextPage = useMemo(() => () => {
    setCurrentPage((value) => Math.min(totalPages || 1, value + 1))
  }, [totalPages])

  const prevPage = useMemo(() => () => {
    setCurrentPage((value) => Math.max(1, value - 1))
  }, [])

  const setZoom = useMemo(() => (value: number) => {
    setZoomState(clamp(value))
  }, [])

  return {
    totalPages,
    currentPage,
    pageImage,
    loading,
    error,
    zoom,
    goToPage,
    nextPage,
    prevPage,
    setZoom,
  }
}
