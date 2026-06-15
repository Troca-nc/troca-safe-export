import Header from '@/components/layout/Header'
import AppelsOffresClient from '@/app/appels-offres/AppelsOffresClient'

export const metadata = {
  title: "Appels d'offres — Kalico NC",
  description:
    'Trouvez un professionnel vérifié en Nouvelle-Calédonie, comparez les avis et envoyez une demande de devis rapide.',
}

export default function AppelsOffresPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-page)]">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <AppelsOffresClient />
      </section>
    </main>
  )
}
