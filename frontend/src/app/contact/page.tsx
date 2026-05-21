import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import Header from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Contact — Troca',
  description: 'Contactez l’équipe Troca pour le support, les demandes juridiques et les signalements.',
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="font-display font-bold text-xl text-night mb-3">{title}</h2>
      <div className="text-sm text-night/70 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="font-display font-bold text-3xl text-night mb-2">Contact</h1>
          <p className="text-night/40 text-sm">
            Une question, un souci technique, un signalement ou une demande juridique ?
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Card title="Support general">
            <p>
              Pour les questions sur l&apos;utilisation du site, les comptes, les annonces ou les
              paiements.
            </p>
            <p>
              <a href="mailto:contact@troca.nc" className="text-coral underline">
                contact@troca.nc
              </a>
            </p>
          </Card>

          <Card title="Donnees personnelles">
            <p>
              Pour toute demande d&apos;accès, de rectification, de suppression ou de limitation de
              traitement.
            </p>
            <p>
              <a href="mailto:privacy@troca.nc" className="text-coral underline">
                privacy@troca.nc
              </a>
            </p>
          </Card>

          <Card title="Juridique et mentions">
            <p>
              Pour les mentions légales, les sujets de propriété intellectuelle ou les demandes
              relatives aux CGU.
            </p>
            <p>
              <a href="mailto:legal@troca.nc" className="text-coral underline">
                legal@troca.nc
              </a>
            </p>
          </Card>

          <Card title="Signaler une annonce">
            <p>
              Utilisez directement le bouton &quot;Signaler&quot; présent sur chaque annonce pour
              déclencher une modération rapide.
            </p>
            <p>
              Consultez aussi la page{' '}
              <Link href="/securite" className="text-coral underline">
                Sécurité
              </Link>
              .
            </p>
          </Card>
        </div>

        <section className="mt-6 card p-5 bg-coral/5 border-coral/20">
          <h2 className="font-display font-bold text-xl text-night mb-2">Délais de réponse</h2>
          <p className="text-sm text-night/70 leading-relaxed">
            L&apos;équipe vise une première réponse sous 24 à 48 heures ouvrées pour le support
            général. Les urgences liées à la sécurité ou à un contenu manifestement illicite sont
            traitées en priorité.
          </p>
        </section>
      </main>
    </>
  )
}
