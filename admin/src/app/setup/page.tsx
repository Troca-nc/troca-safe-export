export default function SetupPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Configuration TOTP indisponible</h1>
      <p className="mt-4">La configuration publique est désactivée. Le provisionnement est réalisé hors ligne par un opérateur autorisé.</p>
      <p className="mt-2">Aucun secret d’authentification n’est affiché ici.</p>
    </main>
  )
}
