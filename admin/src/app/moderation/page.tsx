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
      <section className="admin-card">
        <p className="admin-label">Modération</p>
        <h1 className="mt-2 text-3xl font-semibold">File d’attente centralisée</h1>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="admin-card">
          <h2 className="text-xl font-semibold">Signalements</h2>
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
          <h2 className="text-xl font-semibold">Enseignes à vérifier</h2>
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
