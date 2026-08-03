import { AlertTriangle, Check, Sparkles } from 'lucide-react'

type ListingCoachCardProps = {
  photoCount: number
  description: string
  className?: string
}

type AdvicePayload = {
  title: string
  summary: string
  liftLabel: string
  score: number
  photoTips: string[]
  descriptionTips: string[]
}

function getEstimatedLift(photoCount: number) {
  if (photoCount >= 5) return { label: 'Jusqu� +60 % de visibilit� estim�e', score: 92 }
  if (photoCount >= 3) return { label: 'Jusqu� +45 % de visibilit� estim�e', score: 78 }
  if (photoCount === 2) return { label: 'Jusqu� +25 % de visibilit� estim�e', score: 64 }
  if (photoCount === 1) return { label: 'Jusqu� +12 % de visibilit� estim�e', score: 48 }
  return { label: 'Ajoutez des photos pour gagner en visibilit�', score: 32 }
}

function buildAdvice(photoCount: number, description: string): AdvicePayload {
  const cleanedDescription = description.trim()
  const lift = getEstimatedLift(photoCount)
  const descriptionLength = cleanedDescription.length

  const title =
    photoCount >= 3
      ? 'Votre annonce inspire d�j� confiance'
      : photoCount > 0
        ? 'Quelques photos de plus feront la diff�rence'
        : 'Les annonces illustr�es attirent davantage lattention'

  const summary =
    photoCount >= 3
      ? `Avec ${photoCount} photos, votre annonce est d�j� bien arm�e pour rassurer les acheteurs.`
      : photoCount === 2
        ? 'Avec 3 photos, votre annonce gagne nettement en clart� et en cr�dibilit�.'
        : photoCount === 1
          ? 'Une seule photo, cest un d�but. Ajoutez des angles compl�mentaires pour mieux vendre.'
          : 'Les annonces sans photos passent souvent � c�t� de clics. Une image principale change tout.'

  const photoTips =
    photoCount >= 3
      ? [
          'Gardez une photo principale nette et lumineuse.',
          'Ajoutez un gros plan pour montrer les d�tails ou l�tat.',
          'Compl�tez avec une vue densemble pour rassurer.',
        ]
      : photoCount === 2
        ? [
            'Ajoutez une photo de face ou de vue densemble.',
            'Montrez un d�tail utile pour aider � se projeter.',
            'Le trio gagnant: vue globale, d�tail, contexte.',
          ]
        : [
            'Ajoutez au moins 3 photos pour inspirer confiance.',
            'Privil�giez une image nette, bien cadr�e et lumineuse.',
            'Montrez lobjet sous plusieurs angles avant de publier.',
          ]

  const descriptionTips =
    descriptionLength >= 180
      ? [
          'Votre description est d�j� d�taill�e: relisez juste le premier paragraphe.',
          'V�rifiez que le prix, l�tat et le lieu sont visibles rapidement.',
        ]
      : descriptionLength >= 80
        ? [
            'Bonne base: ajoutez une phrase sur les accessoires ou les d�fauts �ventuels.',
            'Pr�cisez le mode de remise ou la disponibilit� si utile.',
          ]
        : [
            'Ajoutez 2 � 3 phrases sur l�tat, lhistorique et la raison de vente.',
            'Mentionnez ce qui rassure: entretien, accessoires, facture, livraison.',
          ]

  return {
    title,
    summary,
    liftLabel: lift.label,
    score: lift.score,
    photoTips,
    descriptionTips,
  }
}

export default function ListingCoachCard({ photoCount, description, className }: ListingCoachCardProps) {
  const advice = buildAdvice(photoCount, description)

  return (
    <div
      className={`rounded-[2rem] border border-night/8 bg-[linear-gradient(180deg,_rgba(8,32,50,0.98),_rgba(8,32,50,0.9))] p-5 text-white shadow-[0_24px_80px_rgba(8,32,50,0.18)] ${className ?? ''}`}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-lagoon">
        <Sparkles className="h-3.5 w-3.5" />
        Conseil annonce
      </div>

      <h3 className="mt-4 text-lg font-bold text-white">{advice.title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">{advice.summary}</p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/8 p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-semibold text-white">Visibilit� estim�e</span>
          <span className="font-bold text-lagoon">{advice.liftLabel}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-lagoon transition-all" style={{ width: `${advice.score}%` }} />
        </div>
        <p className="mt-3 text-xs leading-5 text-white/60">
          Les annonces avec plusieurs photos et une description pr�cise rassurent davantage les acheteurs.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Photos</p>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            {advice.photoTips.map((tip) => (
              <li key={tip} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-jungle" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Description</p>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            {advice.descriptionTips.map((tip) => (
              <li key={tip} className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
