import clsx from 'clsx'

export function DataTable({
  columns,
  rows,
  emptyLabel = 'Aucune donnée',
}: {
  columns: Array<{ key: string; label: string; className?: string }>
  rows: Array<Record<string, any>>
  emptyLabel?: string
}) {
  return (
    <div className="max-w-full overflow-x-auto rounded-[1.25rem] border border-[var(--admin-line)] bg-[var(--admin-paper)] shadow-[0_12px_32px_rgba(18,58,68,0.04)]">
      <table className="min-w-[720px] w-full divide-y divide-[var(--admin-line)] text-sm">
        <thead className="bg-[var(--admin-cream)] text-[var(--admin-ink-soft)]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={clsx('px-4 py-3 text-left font-semibold', column.className)}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--admin-line)] text-[var(--admin-ink)]">
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.id ?? index} className="transition hover:bg-[var(--admin-cream)]/70">
                {columns.map((column) => (
                  <td key={column.key} className={clsx('px-4 py-3 align-top', column.className)}>
                    {row[column.key] ?? 'Non renseigné'}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-12 text-center text-[var(--admin-ink-soft)]" colSpan={columns.length}>
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

