'use client'

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="admin-card" role="alert">
      <p className="admin-kicker">Chargement interrompu</p>
      <h1 className="admin-section-title mt-2">Données administratives indisponibles</h1>
      <p className="admin-muted mt-4">
        Le chargement a échoué. Cela ne signifie pas que la liste est vide ou qu’aucun signalement n’existe.
      </p>
      <button type="button" className="admin-button mt-6" onClick={() => reset()}>
        Réessayer
      </button>
    </section>
  )
}
