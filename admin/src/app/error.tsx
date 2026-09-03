'use client'

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="admin-card" role="alert">
      <h1 className="text-2xl font-semibold">Données administratives indisponibles</h1>
      <p className="mt-4 text-slate-300">
        Le chargement a échoué. Cela ne signifie pas que la liste est vide ou qu’aucun signalement n’existe.
      </p>
      <button type="button" className="admin-button mt-6" onClick={() => reset()}>
        Réessayer
      </button>
    </section>
  )
}
