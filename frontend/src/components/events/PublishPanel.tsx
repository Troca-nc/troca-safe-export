import { ArrowRight, Save } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { DeepPanel } from '@/components/ui/Card'

export function PublishPanel({ remaining, publishing, savingDraft, error, success, mode = 'create', onSaveDraft, subject = 'événement', publishLabel, readyMessage }: {
  remaining: number
  publishing: boolean
  savingDraft: boolean
  error: string
  success: string
  mode?: 'create' | 'edit'
  onSaveDraft: () => void
  subject?: string
  publishLabel?: string
  readyMessage?: string
}) {
  const ready = remaining === 0
  return (
    <DeepPanel className="flex flex-wrap items-center justify-between gap-6 sm:p-7">
      <div className="max-w-lg">
        <h2 className="font-display text-h2 text-cream">{mode === 'edit' ? 'Prêt à enregistrer ?' : 'Prêt à publier ?'}</h2>
        <p className="mt-2 text-body-sm text-cream/70">{ready ? (readyMessage || (mode === 'edit' ? `Les changements seront appliqués à la fiche de ton ${subject}.` : `Tout est renseigné. Ton ${subject} sera visible dès la publication.`)) : `Il reste ${remaining} bloc${remaining > 1 ? 's' : ''} à compléter. Vérifie la liste à droite.`}</p>
        {error ? <p role="alert" className="mt-3 text-body-sm text-alert-error">{error}</p> : null}
        {success ? <p role="status" className="mt-3 text-body-sm text-success-on-deep">{success}</p> : null}
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        {mode === 'create' ? <Button type="button" variant="secondary" loading={savingDraft} loadingLabel="Enregistrement…" className="w-full border-cream/50 text-cream hover:bg-cream/10 sm:w-auto" onClick={onSaveDraft}><Save className="h-4 w-4" />Enregistrer le brouillon</Button> : null}
        <Button type="submit" loading={publishing} loadingLabel={mode === 'edit' ? 'Enregistrement…' : 'Publication…'} disabled={!ready} className="w-full sm:w-auto">{publishLabel || (mode === 'edit' ? 'Enregistrer les modifications' : `Publier ${subject === 'événement' ? 'l’événement' : `le ${subject}`}`)}<ArrowRight className="h-4 w-4" /></Button>
      </div>
    </DeepPanel>
  )
}
