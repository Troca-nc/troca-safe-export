import Header from '@/components/layout/Header'
import AppelsOffresClient from '@/app/appels-offres/AppelsOffresClient'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata = buildPageMetadata({
  title: "Appels d'offres - Kalico NC",
  description: 'Publiez votre besoin en 2 minutes. Les pros cal�doniens v�rifi�s vous r�pondent.',
  path: '/appels-offres',
})

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
