import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import Header from '@/components/layout/Header'
import FaqAccordion from '@/components/contact/FaqAccordion'
import ContactForm from '@/components/contact/ContactForm'
import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact & FAQ — Kalico NC',
  description: "Une question ? Consultez notre FAQ ou contactez l'équipe Kalico.",
  path: '/contact',
})

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 font-display text-xl font-bold text-night">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-night/70">{children}</div>
    </section>
  )
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-10">
          <h1 className="mb-2 font-display text-3xl font-bold text-night">Contact</h1>
          <p className="text-sm text-night/40">
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
              <a href="mailto:contact@kalico.nc" className="text-coral underline">
                contact@kalico.nc
              </a>
            </p>
          </Card>

          <Card title="Donnees personnelles">
            <p>
              Pour toute demande d&apos;accès, de rectification, de suppression ou de limitation de
              traitement.
            </p>
            <p>
              <a href="mailto:privacy@kalico.nc" className="text-coral underline">
                privacy@kalico.nc
              </a>
            </p>
          </Card>

          <Card title="Juridique et mentions">
            <p>
              Pour les mentions légales, les sujets de propriété intellectuelle ou les demandes
              relatives aux CGU.
            </p>
            <p>
              <a href="mailto:legal@kalico.nc" className="text-coral underline">
                legal@kalico.nc
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

        <section className="mt-10">
          <FaqAccordion />
        </section>

        <div className="mt-8 text-sm text-night/65">
          Vous n&apos;avez pas trouvé votre réponse ?{' '}
          <a href="#formulaire-contact" className="font-semibold text-coral underline">
            Contactez-nous directement
          </a>
        </div>

        <section id="formulaire-contact" className="mt-6">
          <ContactForm />
        </section>
      </main>
    </>
  )
}
