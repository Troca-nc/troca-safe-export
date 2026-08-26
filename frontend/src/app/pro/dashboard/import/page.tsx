'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2, RefreshCw, Upload, CheckCircle2, Clock3, ArrowRight, Database, History } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

import { importApi } from '@/lib/api'

type ImportField = {
  key: string
  label: string
  required: boolean
}

type ImportJob = {
  id: number
  pro_id: number
  original_filename: string
  mime_type: string
  file_size_bytes: number
  file_format: string
  status: string
  total_rows: number
  processed_rows: number
  success_count: number
  update_count: number
  error_count: number
  headers: string[]
  preview_rows: Array<Record<string, unknown>>
  column_mapping: Record<string, string>
  errors: Array<{ row?: number; reason?: string; data?: Record<string, unknown> }>
  report: { summary?: Record<string, unknown>; errors?: Array<{ row?: number; reason?: string }> } | null
  progress: number
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

const FALLBACK_FIELDS: ImportField[] = [
  { key: 'title', label: 'Titre / Nom du produit', required: true },
  { key: 'description', label: 'Description', required: false },
  { key: 'price_xpf', label: 'Prix (XPF)', required: true },
  { key: 'price_type', label: 'Type de prix', required: false },
  { key: 'category', label: 'Categorie', required: false },
  { key: 'stock', label: 'Stock / Quantite', required: false },
  { key: 'unit', label: 'Unite', required: false },
  { key: 'sku', label: 'Reference / Code-barres', required: false },
  { key: 'is_available', label: 'Disponible', required: false },
  { key: 'photo_url', label: 'URL photo principale', required: false },
]

const FIELD_HINTS: Record<string, string[]> = {
  title: ['titre', 'nom', 'produit', 'label', 'title'],
  description: ['description', 'details', 'detail', 'texte'],
  price_xpf: ['prix', 'price', 'montant', 'xpf', 'tarif'],
  price_type: ['type', 'price_type', 'tarif', 'pricing'],
  category: ['categorie', 'category', 'famille', 'groupe'],
  stock: ['stock', 'quantite', 'quantity', 'qty'],
  unit: ['unite', 'unit', 'mesure', 'format'],
  sku: ['sku', 'reference', 'code', 'barcode'],
  is_available: ['disponible', 'available', 'actif', 'en stock'],
  photo_url: ['photo', 'image', 'url'],
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function suggestFieldMapping(headers: string[]) {
  const mapping: Record<string, string> = {}
  const normalized = headers.map((header) => ({ header, normalized: normalizeText(header) }))

  for (const field of FALLBACK_FIELDS) {
    const hints = FIELD_HINTS[field.key] || []
    const match = normalized.find((item) => hints.some((hint) => item.normalized.includes(hint)))
    if (match) {
      mapping[field.key] = match.header
    }
  }

  return mapping
}

function buildSourceMapping(targetToHeader: Record<string, string>) {
  const mapping: Record<string, string> = {}
  for (const [targetField, header] of Object.entries(targetToHeader)) {
    const value = String(header || '').trim()
    if (!value) continue
    mapping[value] = targetField
  }
  return mapping
}

function formatDate(value: string | null) {
  if (!value) return 'Non renseigne'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Non renseigne'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Ko'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function ProDashboardImportPage() {
  const [fields, setFields] = useState<ImportField[]>(FALLBACK_FIELDS)
  const [history, setHistory] = useState<ImportJob[]>([])
  const [job, setJob] = useState<ImportJob | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pollingRef = useRef<number | null>(null)
  const pollingJobIdRef = useRef<number | null>(null)

  const requiredFields = useMemo(() => fields.filter((field) => field.required), [fields])
  const missingRequired = useMemo(
    () => requiredFields.filter((field) => !String(mapping[field.key] || '').trim()),
    [mapping, requiredFields],
  )
  const previewHeaders = useMemo(() => job?.headers ?? [], [job])
  const previewRows = useMemo(() => job?.preview_rows ?? [], [job])

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const historyRes = await importApi.history().catch(() => null)

        if (!alive) return

        setFields(FALLBACK_FIELDS)

        const nextHistory = Array.isArray(historyRes?.data?.data) ? historyRes.data.data : []
        setHistory(nextHistory)
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()

    return () => {
      alive = false
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
      }
      pollingRef.current = null
      pollingJobIdRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!job) {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      pollingJobIdRef.current = null
      setPolling(false)
      return
    }

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      pollingJobIdRef.current = null
      setPolling(false)
      return
    }

    if (pollingRef.current && pollingJobIdRef.current === job.id) return;

    if (pollingRef.current) {
      window.clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    setPolling(true)
    pollingJobIdRef.current = job.id
    pollingRef.current = window.setInterval(async () => {
      try {
        const response = await importApi.status(job.id)
        const nextJob = response.data?.data ?? null
        if (!nextJob) return
        setJob(nextJob)
        if (['completed', 'failed', 'cancelled'].includes(nextJob.status)) {
          if (pollingRef.current) {
            window.clearInterval(pollingRef.current)
            pollingRef.current = null
          }
          setPolling(false)
          const latestHistory = await importApi.history().catch(() => null)
          const jobs = Array.isArray(latestHistory?.data?.data) ? latestHistory.data.data : []
          setHistory(jobs)
        }
      } catch {
        // polling silencieux
      }
    }, 2000)
  }, [job])

  const handleFileUpload = async (file: File | null) => {
    if (!file) return

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const response = await importApi.upload(file)
      const nextJob = response.data?.data as ImportJob | undefined
      if (!nextJob) {
        throw new Error("Impossible de preparer l'import.")
      }

      setJob(nextJob)
      setMapping(suggestFieldMapping(nextJob.headers || []))
      setSuccess(`Fichier chargï¿½: ${nextJob.original_filename}`)
      const latestHistory = await importApi.history().catch(() => null)
      const jobs = Array.isArray(latestHistory?.data?.data) ? latestHistory.data.data : []
      setHistory(jobs)
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Impossible de charger ce fichier.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleProcess = async () => {
    if (!job) return
    if (missingRequired.length) {
      setError(`Champs requis manquants: ${missingRequired.map((field) => field.label).join(', ')}`)
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await importApi.saveMapping(job.id, buildSourceMapping(mapping))
      const nextJob = response.data?.data as ImportJob | undefined
      if (nextJob) {
        setJob(nextJob)
        setSuccess(`Import termine: ${nextJob.success_count} creation(s), ${nextJob.update_count} mise(s) a jour, ${nextJob.error_count} erreur(s).`)
      }
      const latestHistory = await importApi.history().catch(() => null)
      const jobs = Array.isArray(latestHistory?.data?.data) ? latestHistory.data.data : []
      setHistory(jobs)
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Impossible de lancer l'import.")
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadTemplate = () => {
    const workbook = XLSX.utils.book_new()
    const sheet = XLSX.utils.aoa_to_sheet([
      fields.map((field) => field.label),
    ])
    XLSX.utils.book_append_sheet(workbook, sheet, 'Modele')
    const array = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    downloadBlob(new Blob([array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'kalico-import-modele.xlsx')
  }

  const handleDownloadErrors = () => {
    if (!job?.errors?.length) return
    const csv = Papa.unparse(job.errors.map((error) => ({
      ligne: error.row ?? '',
      raison: error.reason ?? '',
      donnees: JSON.stringify(error.data ?? {}),
    })))
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `kalico-import-erreurs-${job.id}.csv`)
  }

  const reportSummary = (job?.report?.summary || {}) as Record<string, unknown>
  const summary = {
    total_rows: Number(reportSummary.total_rows ?? job?.total_rows ?? 0),
    processed_rows: Number(reportSummary.processed_rows ?? job?.processed_rows ?? 0),
    success_count: Number(reportSummary.success_count ?? job?.success_count ?? 0),
    update_count: Number(reportSummary.update_count ?? job?.update_count ?? 0),
    error_count: Number(reportSummary.error_count ?? job?.error_count ?? 0),
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-[2rem] bg-sand/70" />
        <div className="h-72 animate-pulse rounded-[2rem] bg-sand/70" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Import catalogue</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Importer des produits depuis CSV ou Excel</h1>
            <p className="mt-2 max-w-3xl text-sm text-night/60">
              Chargez un fichier, mappez les colonnes, lancez l&apos;import puis suivez le traitement jusqu&apos;au rapport final.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
            >
              <Download className="h-4 w-4" />
              Modï¿½le Excel
            </button>
            <Link
              href="/pro/dashboard/catalogue"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <ArrowRight className="h-4 w-4" />
              Retour catalogue
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-kalico-blue/80">Etape 1</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">Charger un fichier</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-nc-lagonLight px-3 py-1.5 text-xs font-semibold text-nc-lagon">
              <FileSpreadsheet className="h-4 w-4" />
              CSV / XLSX / XLS
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)]/40 px-6 py-10 text-center transition hover:border-[#0A7EA4]/30 hover:bg-nc-lagonLight/30">
            <Upload className="h-10 w-10 text-[#0A7EA4]" />
            <span className="mt-3 text-lg font-semibold text-night">Choisir un fichier d&apos;import</span>
            <span className="mt-1 text-sm text-night/55">Une fois le fichier chargï¿½, les colonnes seront dï¿½tectï¿½es automatiquement.</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              className="sr-only"
              onChange={(event) => void handleFileUpload(event.target.files?.[0] || null)}
            />
          </label>

          {job ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nc-emeraude">Fichier</p>
                <p className="mt-2 text-sm font-semibold text-night">{job.original_filename}</p>
                <p className="mt-1 text-xs text-night/55">{job.file_format.toUpperCase()} ï¿½ {formatFileSize(job.file_size_bytes)}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nc-emeraude">Lignes dï¿½tectï¿½es</p>
                <p className="mt-2 text-2xl font-bold text-night">{job.total_rows}</p>
                <p className="mt-1 text-xs text-night/55">Le traitement se base sur ces lignes.</p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          {job ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-night/45">
                <span className={`rounded-full px-3 py-1 ${job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-nc-lagonLight text-nc-lagon'}`}>
                  {job.status}
                </span>
                {polling ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Traitement en cours
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-background-secondary)] px-3 py-1 text-night/60">
                  <Clock3 className="h-3.5 w-3.5" />
                  {job.progress}% traite
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
                  <p className="text-xs text-night/55">Total</p>
                  <p className="mt-1 text-xl font-bold text-night">{summary.total_rows ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
                  <p className="text-xs text-night/55">Crï¿½ations</p>
                  <p className="mt-1 text-xl font-bold text-night">{summary.success_count ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
                  <p className="text-xs text-night/55">Mises ï¿½ jour</p>
                  <p className="mt-1 text-xl font-bold text-night">{summary.update_count ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
                  <p className="text-xs text-night/55">Erreurs</p>
                  <p className="mt-1 text-xl font-bold text-night">{summary.error_count ?? 0}</p>
                </div>
              </div>
            </div>
          ) : null}
        </article>

        <aside className="space-y-4">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Conseil de mapping</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Colonnes minimales</h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-night/65">
              Le systï¿½me accepte les catï¿½gories et communes de secours si elles ne sont pas presentes dans le fichier. Mappez surtout le titre et le prix.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              {requiredFields.map((field) => (
                <span key={field.key} className="rounded-full bg-kalico-blue/10 px-3 py-1 text-kalico-blue">
                  {field.label}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
                <History className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-kalico-blue/80">Historique</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">10 derniers imports</h2>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {history.length ? history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setJob(item)
                    setMapping(
                      Object.fromEntries(
                        Object.entries(item.column_mapping || {}).map(([header, field]) => [field, header]),
                      ),
                    )
                  }}
                  className="w-full rounded-2xl border border-[var(--color-border)] p-3 text-left transition hover:bg-[var(--color-background-secondary)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-night">{item.original_filename}</p>
                      <p className="mt-1 text-xs text-night/55">{formatDate(item.created_at)} ï¿½ {item.total_rows} ligne(s)</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : item.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-nc-lagonLight text-nc-lagon'}`}>
                      {item.status}
                    </span>
                  </div>
                </button>
              )) : (
                <p className="text-sm text-night/55">Aucun import rï¿½cent.</p>
              )}
            </div>
          </article>
        </aside>
      </section>

      {job ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-kalico-blue/80">Etape 2</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Mapper les colonnes</h2>
              </div>
              <div className="rounded-full bg-nc-lagonLight px-3 py-1.5 text-xs font-semibold text-nc-lagon">
                {previewHeaders.length} colonne(s)
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {fields.map((field) => (
                <div key={field.key} className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4 md:grid-cols-[1.2fr_1fr] md:items-center">
                  <div>
                    <p className="text-sm font-semibold text-night">
                      {field.label}
                      {field.required ? <span className="ml-2 rounded-full bg-kalico-blue/10 px-2 py-0.5 text-[11px] text-kalico-blue">Requis</span> : null}
                    </p>
                    <p className="mt-1 text-xs text-night/55">
                      {field.key === 'title'
                        ? 'Le titre est indispensable pour crï¿½er ou mettre ï¿½ jour un produit.'
                        : field.key === 'price_xpf'
                          ? 'Le prix alimente directement le catalogue et la publication.'
                          : 'Optionnel mais utile pour enrichir le catalogue.'}
                    </p>
                  </div>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))}
                    className="input w-full rounded-2xl"
                  >
                    <option value="">Ignorer cette colonne</option>
                    {previewHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {missingRequired.length ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Colonnes requises manquantes: {missingRequired.map((field) => field.label).join(', ')}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleProcess()}
                disabled={saving || uploading}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Lancer l&apos;import
              </button>
              <button
                type="button"
                onClick={() => setMapping(suggestFieldMapping(previewHeaders))}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
              >
                <RefreshCw className="h-4 w-4" />
                Auto-mapper
              </button>
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-kalico-blue/80">Apercu</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Premieres lignes du fichier</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-nc-lagonLight px-3 py-1.5 text-xs font-semibold text-nc-lagon">
                <FileText className="h-4 w-4" />
                {previewRows.length} ligne(s)
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)]">
              <div className="overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[var(--color-background-secondary)] text-night/70">
                    <tr>
                      {previewHeaders.slice(0, 6).map((header) => (
                        <th key={header} className="px-4 py-3 font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-t border-[var(--color-border)]">
                        {previewHeaders.slice(0, 6).map((header) => (
                          <td key={header} className="max-w-[180px] px-4 py-3 align-top text-night/65">
                            <span className="line-clamp-2">{String((row as Record<string, unknown>)[header] ?? '')}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {job.errors?.length ? (
              <button
                type="button"
                onClick={handleDownloadErrors}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
              >
                <Download className="h-4 w-4" />
                Tï¿½lï¿½charger les erreurs CSV
              </button>
            ) : null}
          </article>
        </section>
      ) : null}
    </div>
  )
}
