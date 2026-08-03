'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, BadgeCheck, CheckCircle2, Clock3, Loader2, ShieldCheck, XCircle } from 'lucide-react'

import AdminLayout from '@/components/admin/AdminLayout'
import { adminApi } from '@/lib/api'

type AdminProDocument = {
  id: number
  pro_id: number
  pro_name: string
  pro_email: string
  pro_commune?: string | null
  document_type_label: string
  label: string | null
  file_url: string
  file_name: string | null
  file_size: number | null
  status: 'pending' | 'validated' | 'rejected' | string
  rejection_reason: string | null
  uploaded_at: string
  validated_at: string | null
}

function formatDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return '0 o'
  const units = ['o', 'Ko', 'Mo', 'Go']
  let current = bytes
  let index = 0
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  const rounded = current >= 10 || index === 0 ? Math.round(current) : Number(current.toFixed(1))
  return `${rounded} ${units[index]}`
}

function getStatusBadge(status: string) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'validated') return { label: 'Valid�', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  if (normalized === 'rejected') return { label: 'Refus�', tone: 'bg-rose-50 text-rose-700 border-rose-200' }
  return { label: 'En attente', tone: 'bg-amber-50 text-amber-700 border-amber-200' }
}

function AdminProDocumentsContent() {
  const [documents, setDocuments] = useState<AdminProDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const response = await adminApi.listProDocuments()
      setDocuments(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch {
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const stats = useMemo(() => ({
    total: documents.length,
    pending: documents.filter((doc) => doc.status === 'pending').length,
    validated: documents.filter((doc) => doc.status === 'validated').length,
    rejected: documents.filter((doc) => doc.status === 'rejected').length,
  }), [documents])

  const handleValidate = async (id: number, status: 'validated' | 'rejected') => {
    const rejection_reason = status === 'rejected' ? window.prompt('Raison du refus ?')?.trim() || 'Document refus�' : undefined
    setActionId(id)
    setError('')
    try {
      await adminApi.validateProDocument(id, status === 'rejected' ? { status, rejection_reason } : { status })
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de valider ce document.')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-corail">Admin</p>
            <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">Justificatifs Pro</h1>
            <p className="mt-4 text-sm leading-relaxed text-white/72 md:text-base">
              Validez ou refusez les documents d�pos�s par les professionnels sans quitter le panneau dadministration.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-nc-corail">
            <BadgeCheck className="h-4 w-4" />
            {stats.pending} en attente
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'En attente', value: stats.pending },
            { label: 'Valid�s', value: stats.validated },
            { label: 'Refus�s', value: stats.rejected },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{item.value.toLocaleString('fr-FR')}</p>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="h-64 animate-pulse rounded-[2rem] bg-sand/70" />
      ) : documents.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center text-night/55 shadow-sm">
          <ShieldCheck className="mx-auto h-8 w-8 text-night/25" />
          <p className="mt-3 text-lg font-semibold text-night">Aucun justificatif � traiter</p>
          <p className="mt-2 text-sm">Les nouveaux d�p�ts appara�tront ici d�s quun professionnel en enverra un.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => {
            const status = getStatusBadge(doc.status)
            return (
              <article key={doc.id} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold text-nc-lagon">
                        {doc.document_type_label}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.tone}`}>
                        {status.label}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-night">{doc.label || doc.file_name || 'Justificatif'}</h2>
                    <p className="mt-1 text-sm text-night/60">
                      {doc.pro_name} � {doc.pro_email}{doc.pro_commune ? ` � ${doc.pro_commune}` : ''}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Fichier</p>
                        <p className="mt-1 font-semibold text-night truncate">{doc.file_name || 'Document'}</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Taille</p>
                        <p className="mt-1 font-semibold text-night">{formatFileSize(doc.file_size)}</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">D�pos�</p>
                        <p className="mt-1 font-semibold text-night">{formatDate(doc.uploaded_at)}</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Valid�</p>
                        <p className="mt-1 font-semibold text-night">{formatDate(doc.validated_at)}</p>
                      </div>
                    </div>

                    {doc.rejection_reason ? (
                      <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {doc.rejection_reason}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 lg:w-56">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                    >
                      Ouvrir le fichier
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleValidate(doc.id, 'validated')}
                      disabled={actionId === doc.id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Valider
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleValidate(doc.id, 'rejected')}
                      disabled={actionId === doc.id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />
                      Refuser
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminProDocumentsPage() {
  return (
    <AdminLayout>
      <AdminProDocumentsContent />
    </AdminLayout>
  )
}
