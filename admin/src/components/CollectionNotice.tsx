export function CollectionNotice({
  value,
  emptyLabel = 'Aucune donnée disponible.',
  missingLabel = 'Données non renseignées par le backend.',
}: {
  value: unknown
  emptyLabel?: string
  missingLabel?: string
}) {
  if (Array.isArray(value) && value.length > 0) return null
  return (
    <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
      {Array.isArray(value) ? emptyLabel : missingLabel}
    </p>
  )
}

