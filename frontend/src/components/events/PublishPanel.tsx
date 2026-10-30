import { ArrowRight, Save } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { DeepPanel } from '@/components/ui/Card'

export function PublishPanel({ remaining, publishing, savingDraft, error, success, onSaveDraft }: {
  remaining: number
  publishing: boolean
  savingDraft: boolean
  error: string
  success: string
  onSaveDraft: () => void
}) {
  const ready = remaining === 0
  return (
    <DeepPanel className="flex flex-wrap items-center justify-between gap-6 sm:p-7">
      <div className="max-w-lg">
        <h2 className="font-display text-h2 text-cream">Prêt à publier ?</h2>
        <p className="mt-2 text-body-sm text-cream/70">{ready ? 'Tout est renseigné. Ton événement sera visible dès la publication.' : `Il reste ${remaining} bloc${remaining > 1 ? 's' : ''} à compléter. Vérifie la liste à droite.`}</p>
        {error ? <p role="alert" className="mt-3 text-body-sm text-alert-error">{error}</p> : null}
        {success ? <p role="status" className="mt-3 text-body-sm text-success-on-deep">{success}</p> : null}
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button type="button" variant="secondary" loading={savingDraft} loadingLabel="Enregistrement…" className="w-full border-cream/50 text-cream hover:bg-cream/10 sm:w-auto" onClick={onSaveDraft}><Save className="h-4 w-4" />Enregistrer le brouillon</Button>
        <Button type="submit" loading={publishing} loadingLabel="Publication…" disabled={!ready} className="w-full sm:w-auto">Publier l’événement<ArrowRight className="h-4 w-4" /></Button>
      </div>
    </DeepPanel>
  )
}
