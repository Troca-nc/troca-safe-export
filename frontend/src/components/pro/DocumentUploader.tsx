'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, BadgeCheck, Loader2, Trash2, Upload, FileText, ShieldCheck } from 'lucide-react'

import { formatFileSize, compressImage } from '@/lib/imageCompressor'
import { proDocumentsApi } from '@/lib/api'

type ProDocument = {
  id: number
  document_type: string
  document_type_label: string
  label: string | null
  download_url: string
  file_name: string | null
  file_size: number | null
  status: 'pending' | 'validated' | 'rejected' | string
  rejection_reason: string | null
  uploaded_at: string
  validated_at: string | null
}

const DOCUMENT_TYPES = [
  { value: 'rc_pro', label: 'RC Professionnelle' },
  { value: 'assurance_decennale', label: 'Assurance Dï¿½cennale' },
  { value: 'certification', label: 'Certification' },
  { value: 'diplome', label: 'Diplï¿½me' },
  { value: 'extrait_ridet', label: 'Extrait RIDET' },
  { value: 'autre', label: 'Autre' },
] as const

function getStatusMeta(status: string) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'validated') return { label: 'Validï¿½', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  if (normalized === 'rejected') return { label: 'Refusï¿½', tone: 'bg-rose-50 text-rose-700 border-rose-200' }
  return { label: 'En attente', tone: 'bg-amber-50 text-amber-700 border-amber-200' }
}

export default function DocumentUploader({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  const [documents, setDocuments] = useState<ProDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [documentType, setDocumentType] = useState<ProDocument['document_type']>('rc_pro')
  const [label, setLabel] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const pendingCount = useMemo(() => documents.filter((doc) => doc.status === 'pending').length, [documents])

  const loadDocuments = async () => {
    try {
      const response = await proDocumentsApi.list()
      setDocuments(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch {
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const openDocument = async (doc: ProDocument) => {
    try {
      const response = await proDocumentsApi.download(doc.id)
      const url = URL.createObjectURL(response.data)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setError('Impossible d\u2019ouvrir ce document.')
    }
  }

  useEffect(() => {
    void loadDocuments()
  }, [])

  const handlePickFile = async (selected: File | null) => {
    if (!selected) {
      setFile(null)
      return
    }

    if (selected.type.startsWith('image/')) {
      try {
        const optimized = await compressImage(selected)
        setFile(optimized)
        return
      } catch {
        // Fallback silencieux sur le fichier original
      }
    }

    setFile(selected)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Choisissez un fichier ï¿½ dï¿½poser.')
      return
    }

    setUploading(true)
    setError('')
    try {
      await proDocumentsApi.upload({
        file,
        document_type: documentType,
        label: label.trim(),
      })
      setFile(null)
      setLabel('')
      setDocumentType('rc_pro')
      await loadDocuments()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible denvoyer le document pour le moment.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce document en attente ?')) return
    try {
      await proDocumentsApi.delete(id)
      await loadDocuments()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de supprimer ce document.')
    }
  }

  return (
    <section className={`rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Mes justificatifs professionnels</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Dï¿½posez vos documents pour accï¿½lï¿½rer la vï¿½rification</h2>
          <p className="mt-2 text-sm text-night/60">
            RC Pro, dï¿½cennale, certifications, diplï¿½mes, extrait RIDET. Les fichiers image sont compressï¿½s avant lenvoi.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-nc-lagon/15 bg-nc-lagonLight px-3 py-1.5 text-sm font-semibold text-nc-lagon">
          <ShieldCheck className="h-4 w-4" />
          {pendingCount} en attente
        </div>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className={`mt-5 grid gap-4 ${compact ? 'lg:grid-cols-[1.1fr_0.9fr]' : 'lg:grid-cols-[1fr_1.05fr]'}`}>
        <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-night">Type de document</span>
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as ProDocument['document_type'])}
              className="input w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
            >
              {DOCUMENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="mt-4 block space-y-2">
            <span className="text-sm font-semibold text-night">Libellï¿½</span>
            <input
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Ex. RC Pro 2026"
              className="input w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
            />
          </label>

          <label className="mt-4 block space-y-2">
            <span className="text-sm font-semibold text-night">Fichier</span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(event) => void handlePickFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[#0A7EA4] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#065f7a]"
            />
            <p className="text-xs text-night/45">PDF, JPG, PNG ou WebP. Maximum recommandï¿½ : 10 Mo.</p>
          </label>

          {file ? (
            <div className="mt-4 rounded-2xl border border-night/8 bg-white px-4 py-3 text-sm text-night/70">
              <p className="font-semibold text-night">{file.name}</p>
              <p className="mt-1 text-xs text-night/45">
                {file.type || 'Fichier'} ï¿½ {formatFileSize(file.size)}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            DÃ©poser le document
          </button>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-night">Historique des justificatifs</h3>
              <p className="text-sm text-night/55">Suivez lÃtat de chaque dï¿½pï¿½t.</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/40">{documents.length} document{documents.length > 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="mt-4 h-32 animate-pulse rounded-2xl bg-sand/60" />
          ) : documents.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-night/12 bg-sand/20 p-5 text-sm text-night/55">
              <FileText className="h-5 w-5 text-kalico-blue" />
              <p className="mt-3 font-semibold text-night">Aucun document pour le moment.</p>
              <p className="mt-1 text-sm text-night/55">Dï¿½posez un premier justificatif pour lancer la vï¿½rification.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {documents.map((doc) => {
                const status = getStatusMeta(doc.status)
                return (
                  <article key={doc.id} className="rounded-2xl border border-night/8 bg-[var(--color-background-secondary)] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-night/70">
                            <BadgeCheck className="h-3.5 w-3.5 text-[#0A7EA4]" />
                            {doc.document_type_label}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.tone}`}>
                            {status.label}
                          </span>
                        </div>
                        <h4 className="mt-2 truncate text-sm font-semibold text-night">
                          {doc.label || doc.file_name || 'Justificatif'}
                        </h4>
                        <p className="mt-1 text-xs text-night/55">
                          {doc.file_name || 'Fichier'} ï¿½ {formatFileSize(doc.file_size)}
                        </p>
                        {doc.rejection_reason ? (
                          <p className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            {doc.rejection_reason}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void openDocument(doc)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                        >
                          Ouvrir
                        </button>
                        {doc.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(doc.id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Supprimer
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
