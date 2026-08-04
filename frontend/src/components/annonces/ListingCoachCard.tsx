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
  if (photoCount >= 5) return { label: 'Jusquï¿½ +60 % de visibilitï¿½ estimï¿½e', score: 92 }
  if (photoCount >= 3) return { label: 'Jusquï¿½ +45 % de visibilitï¿½ estimï¿½e', score: 78 }
  if (photoCount === 2) return { label: 'Jusquï¿½ +25 % de visibilitï¿½ estimï¿½e', score: 64 }
  if (photoCount === 1) return { label: 'Jusquï¿½ +12 % de visibilitï¿½ estimï¿½e', score: 48 }
  return { label: 'Ajoutez des photos pour gagner en visibilitï¿½', score: 32 }
}

function buildAdvice(photoCount: number, description: string): AdvicePayload {
  const cleanedDescription = description.trim()
  const lift = getEstimatedLift(photoCount)
  const descriptionLength = cleanedDescription.length

  const title =
    photoCount >= 3
      ? 'Votre annonce inspire dï¿½jï¿½ confiance'
      : photoCount > 0
        ? 'Quelques photos de plus feront la diffï¿½rence'
        : 'Les annonces illustrï¿½es attirent davantage lattention'

  const summary =
    photoCount >= 3
      ? `Avec ${photoCount} photos, votre annonce est dï¿½jï¿½ bien armï¿½e pour rassurer les acheteurs.`
      : photoCount === 2
        ? 'Avec 3 photos, votre annonce gagne nettement en clartï¿½ et en crï¿½dibilitï¿½.'
        : photoCount === 1
          ? 'Une seule photo, cest un dï¿½but. Ajoutez des angles complï¿½mentaires pour mieux vendre.'
          : 'Les annonces sans photos passent souvent ï¿½ cï¿½tï¿½ de clics. Une image principale change tout.'

  const photoTips =
    photoCount >= 3
      ? [
          'Gardez une photo principale nette et lumineuse.',
          'Ajoutez un gros plan pour montrer les dï¿½tails ou lÃtat.',
          'Complï¿½tez avec une vue densemble pour rassurer.',
        ]
      : photoCount === 2
        ? [
            'Ajoutez une photo de face ou de vue densemble.',
            'Montrez un dï¿½tail utile pour aider ï¿½ se projeter.',
            'Le trio gagnant: vue globale, dï¿½tail, contexte.',
          ]
        : [
            'Ajoutez au moins 3 photos pour inspirer confiance.',
            'Privilï¿½giez une image nette, bien cadrï¿½e et lumineuse.',
            'Montrez lobjet sous plusieurs angles avant de publier.',
          ]

  const descriptionTips =
    descriptionLength >= 180
      ? [
          'Votre description est dï¿½jï¿½ dï¿½taillï¿½e: relisez juste le premier paragraphe.',
          'Vï¿½rifiez que le prix, lÃtat et le lieu sont visibles rapidement.',
        ]
      : descriptionLength >= 80
        ? [
            'Bonne base: ajoutez une phrase sur les accessoires ou les dï¿½fauts ï¿½ventuels.',
            'Prï¿½cisez le mode de remise ou la disponibilitï¿½ si utile.',
          ]
        : [
            'Ajoutez 2 ï¿½ 3 phrases sur lÃtat, lhistorique et la raison de vente.',
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
          <span className="font-semibold text-white">Visibilitï¿½ estimï¿½e</span>
          <span className="font-bold text-lagoon">{advice.liftLabel}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-lagoon transition-all" style={{ width: `${advice.score}%` }} />
        </div>
        <p className="mt-3 text-xs leading-5 text-white/60">
          Les annonces avec plusieurs photos et une description prï¿½cise rassurent davantage les acheteurs.
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
