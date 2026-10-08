import { DataTable } from '@/components/DataTable'
import { BusinessActionButtons } from '@/components/BusinessActionButtons'
import { ReportActionButtons } from '@/components/ReportActionButtons'
import { loadAdminJson } from '@/lib/load'

export const dynamic = 'force-dynamic'

export default async function ModerationPage() {
  const payload = await loadAdminJson<any>('/admin/moderation/queue', {
    reports: [],
    pending_business_verifications: [],
    pending_driver_verifications: [],
    total_pending: 0,
  })

  return (
    <div className="space-y-6">
      <section className="border-b border-[var(--admin-line)] pb-7">
        <p className="admin-kicker">Contrôle des contenus</p>
        <h1 className="admin-page-title mt-3">Modération</h1>
        <p className="admin-muted mt-3 text-sm">{payload.total_pending ?? 'Non renseigné'} éléments à traiter</p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="admin-card">
          <h2 className="admin-section-title">Signalements</h2>
          <p className="admin-muted mt-2 text-sm">Décidez à partir du motif et du contenu signalé.</p>
          <DataTable
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'reason', label: 'Motif' },
              { key: 'reporter', label: 'Signalé par' },
              { key: 'created_at', label: 'Date' },
              { key: 'actions', label: 'Actions' },
            ]}
            rows={(payload.reports || []).map((report: any) => ({
              ...report,
              actions: <ReportActionButtons reportId={report.id} />,
            }))}
          />
        </div>
        <div className="admin-card">
          <h2 className="admin-section-title">Enseignes à vérifier</h2>
          <p className="admin-muted mt-2 text-sm">Validation administrative des comptes professionnels.</p>
          <DataTable
            columns={[
              { key: 'business_name', label: 'Enseigne' },
              { key: 'badge', label: 'Badge' },
              { key: 'bon_plan_count', label: 'Bons plans' },
              { key: 'actions', label: 'Actions' },
            ]}
            rows={(payload.pending_business_verifications || []).map((business: any) => ({
              ...business,
              actions: <BusinessActionButtons businessId={business.id} />,
            }))}
          />
        </div>
      </section>
    </div>
  )
}
