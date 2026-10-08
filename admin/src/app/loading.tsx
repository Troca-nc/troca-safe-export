export default function AdminLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Chargement des données administratives">
      <section className="border-b border-[var(--admin-line)] pb-7">
        <div className="h-3 w-32 animate-pulse rounded bg-[var(--admin-line)]" />
        <div className="mt-4 h-12 w-64 max-w-full animate-pulse rounded bg-[var(--admin-line)]" />
        <div className="mt-4 h-4 w-48 animate-pulse rounded bg-[var(--admin-line)]" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="admin-card h-36 animate-pulse">
            <div className="h-3 w-24 rounded bg-[var(--admin-line)]" />
            <div className="mt-5 h-9 w-28 rounded bg-[var(--admin-line)]" />
            <div className="mt-4 h-3 w-36 rounded bg-[var(--admin-line)]" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="admin-card h-80 animate-pulse">
            <div className="h-4 w-40 rounded bg-[var(--admin-line)]" />
            <div className="mt-8 h-56 rounded-xl bg-[var(--admin-cream)]" />
          </div>
        ))}
      </section>
    </div>
  )
}
