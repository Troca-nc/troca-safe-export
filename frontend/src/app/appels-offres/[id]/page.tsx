import Header from '@/components/layout/Header'
import QuoteRequestDetailClient from './QuoteRequestDetailClient'

type PageProps = {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Détail de la demande â€” Kalico NC",
  description: "Consultez le détail d'une demande d'appel d'offres et accédez rapidement au devis ou à la vitrine du professionnel.",
}

export default async function AppelsOffresDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)]">
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <QuoteRequestDetailClient requestId={id} />
      </section>
    </main>
  )
}
