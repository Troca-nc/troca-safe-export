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
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/5 text-slate-300">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={clsx('px-4 py-3 text-left font-semibold', column.className)}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-slate-200">
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.id ?? index} className="hover:bg-white/5">
                {columns.map((column) => (
                  <td key={column.key} className={clsx('px-4 py-3 align-top', column.className)}>
                    {row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-10 text-center text-slate-400" colSpan={columns.length}>
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

