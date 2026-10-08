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
    <p className="mt-3 rounded-md border border-dashed border-[var(--admin-line)] bg-[var(--admin-cream)]/60 px-4 py-4 text-sm text-[var(--admin-ink-soft)]">
      {Array.isArray(value) ? emptyLabel : missingLabel}
    </p>
  )
}

