import Link from 'next/link'

export function LegacyAdminUnavailable() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Administration indisponible</h1>
      <p className="mt-4">Cet ancien écran n’est pas raccordé à un back-office opérationnel.</p>
      <p className="mt-2">Aucune action administrative ne peut être effectuée depuis cet écran.</p>
      <p className="mt-2">Les données et résultats simulés ont été retirés. Un accès vérifié sera proposé après la mise en service du back-office.</p>
      <Link href="/" className="mt-6 inline-block underline">Retour à l’accueil</Link>
    </main>
  )
}
