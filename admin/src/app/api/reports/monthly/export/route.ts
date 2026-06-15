import { NextRequest, NextResponse } from 'next/server'
import { adminBackendJson } from '@/lib/backend'
import { buildSimplePdf } from '@/lib/simplePdf'

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month') || new Date().toISOString().slice(0, 7)
  const format = (request.nextUrl.searchParams.get('format') || 'pdf').toLowerCase()
  const data: any = await adminBackendJson(`/admin/reports/monthly?month=${encodeURIComponent(month)}`)

  if (format === 'csv') {
    const csv = [
      ['month', month],
      ['new_users', String(data?.new_users ?? 0)],
      ['mrr_xpf', String(data?.mrr_xpf ?? 0)],
      ['listings_published', String(data?.listings_published ?? 0)],
    ]
      .map((row) => row.join(','))
      .join('\n')
    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="kalico-report-${month}.csv"`,
      },
    })
  }

  const lines = [
    'Rapport mensuel Kalico NC',
    `Mois: ${month}`,
    '',
    'Faits marquants',
    `- Nouveaux inscrits: ${data?.new_users ?? 0}`,
    `- MRR: ${Number(data?.mrr_xpf ?? 0).toLocaleString('fr-FR')} XPF`,
    `- Annonces publiees: ${data?.listings_published ?? 0}`,
    `- Propositions Troc: ${data?.troc_proposals ?? 0}`,
    `- Troc acceptes: ${data?.troc_accepted ?? 0}`,
    `- Bons Plans: ${data?.bon_plans ?? 0}`,
  ]
  const buffer = buildSimplePdf(lines)
  return new NextResponse(buffer, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="kalico-report-${month}.pdf"`,
    },
  })
}
