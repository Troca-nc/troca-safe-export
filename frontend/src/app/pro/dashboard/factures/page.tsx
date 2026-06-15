'use client'

import { useEffect, useState } from 'react'
import { Download, FileText, Loader2, BadgeCheck } from 'lucide-react'

import { proApi } from '@/lib/api'

type InvoiceItem = {
  id: string | number
  invoice_number: string
  amount_xpf: number
  description?: string | null
  status: string
  created_at: string
  paid_at?: string | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

export default function ProDashboardInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const response = await proApi.getInvoices()
        if (!alive) return
        setInvoices(Array.isArray(response.data?.data) ? response.data.data : [])
      } catch {
        if (!alive) return
        setInvoices([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const handleDownload = async (invoice: InvoiceItem) => {
    setDownloadingId(invoice.id)
    try {
      const response = await proApi.downloadInvoicePdf(invoice.id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${invoice.invoice_number}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-[2rem] bg-sand/70" />
        <div className="h-80 animate-pulse rounded-[2rem] bg-sand/70" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Factures</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Mes factures</h1>
            <p className="mt-2 text-sm text-night/60">Téléchargez vos justificatifs PDF et suivez vos paiements.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-nc-lagonLight px-3 py-1.5 text-sm font-semibold text-nc-lagon">
            <BadgeCheck className="h-4 w-4" />
            {invoices.length} facture{invoices.length > 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {invoices.length > 0 ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
            <thead className="bg-[var(--color-background-secondary)] text-night/60">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">N° Facture</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Description</th>
                <th className="px-4 py-3 text-left font-semibold">Montant</th>
                <th className="px-4 py-3 text-left font-semibold">Statut</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3 font-semibold text-night">{invoice.invoice_number}</td>
                  <td className="px-4 py-3 text-night/70">{formatDate(invoice.created_at)}</td>
                  <td className="px-4 py-3 text-night/70">{invoice.description || 'Paiement Kalico'}</td>
                  <td className="px-4 py-3 text-night/70">{Number(invoice.amount_xpf).toLocaleString('fr-FR')} XPF</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      invoice.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : invoice.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-sand text-night/60'
                    }`}>
                      {invoice.status === 'paid' ? 'Payé' : invoice.status === 'pending' ? 'En attente' : 'Annulé'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDownload(invoice)}
                      disabled={downloadingId === invoice.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)] disabled:opacity-60"
                    >
                      {downloadingId === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Télécharger PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center text-night/55">
          <FileText className="mx-auto h-8 w-8 text-night/25" />
          <p className="mt-3 text-lg font-semibold text-night">Aucune facture disponible</p>
          <p className="mt-2 text-sm">Vos prochaines factures apparaîtront ici après un boost ou un paiement.</p>
        </div>
      )}
    </div>
  )
}
