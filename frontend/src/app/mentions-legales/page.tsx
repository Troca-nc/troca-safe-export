// src/app/mentions-legales/page.tsx
// ── Mentions légales — Troca ──────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Mentions légales — Troca',
  description:
    'Mentions légales de la plateforme Troca, service de petites annonces en Nouvelle-Calédonie.',
}

const LAST_UPDATE = '20 mai 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-display font-bold text-xl text-night mb-4 pb-2 border-b border-night/8">
        {title}
      </h2>
      <div className="text-night/70 leading-relaxed space-y-3 text-sm">{children}</div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-coral shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-10">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-coral font-semibold">
            Mentions légales
          </p>
          <h1 className="font-display font-bold text-3xl text-night mt-2 mb-3">Mentions légales</h1>
          <p className="text-night/45 text-sm leading-relaxed">
            Dernière mise à jour : {LAST_UPDATE}
          </p>
        </div>

        <div className="card p-5 mb-8 bg-coral/5 border-coral/20">
          <p className="text-sm text-night/70 leading-relaxed">
            La présente page a vocation à présenter les informations légales essentielles relatives
            à l’éditeur de la plateforme, à son hébergement, à son activité et aux moyens de
            contact mis à disposition des utilisateurs.
          </p>
        </div>

        <Section title="1. Éditeur du site">
          <P>
            La plateforme Troca est éditée par la société exploitante indiquée ci-dessous. Les
            informations d’identification complètes doivent être maintenues à jour conformément
            aux exigences légales applicables.
          </P>
          <BulletList
            items={[
              'Raison sociale : Troca SAS',
              'Forme juridique : société par actions simplifiée',
              'Siège social : [à compléter]',
              'Immatriculation / RIDET : [à compléter]',
              'Capital social : [à compléter]',
              'Directeur de la publication : [à compléter]',
              'Contact général : contact@troca.nc',
            ]}
          />
        </Section>

        <Section title="2. Hébergement">
          <P>
            Le site et les services associés sont hébergés par un prestataire technique tiers. Les
            informations précises relatives à l’hébergeur doivent être renseignées avant mise en
            production définitive.
          </P>
          <BulletList
            items={[
              'Hébergeur : [à compléter]',
              'Adresse : [à compléter]',
              'Téléphone : [à compléter]',
              'Email : [à compléter]',
            ]}
          />
        </Section>

        <Section title="3. Activité de la plateforme">
          <P>
            Troca est une plateforme de petites annonces et de mise en relation entre particuliers
            et professionnels, destinée au marché local de Nouvelle-Calédonie. La plateforme
            comprend également des espaces dédiés aux bons plans, aux évènements et au covoiturage.
          </P>
          <P>
            Troca agit en qualité d’intermédiaire technique. Sauf disposition expresse contraire,
            Troca n’est pas partie aux transactions conclues entre utilisateurs et n’intervient ni
            dans la négociation, ni dans la livraison, ni dans le paiement des biens ou services
            proposés.
          </P>
          <P>
            Les fonctionnalités de partage social, de géolocalisation, de favoris, de messagerie,
            de vérification des profils et de modération font partie intégrante du service.
          </P>
        </Section>

        <Section title="4. Propriété intellectuelle">
          <P>
            L’ensemble des éléments composant le site et l’application Troca, notamment les textes,
            logos, interfaces, graphismes, bases de données, images, photographies, vidéos, chartes
            graphiques, code source et signes distinctifs, est protégé par le droit de la propriété
            intellectuelle.
          </P>
          <P>
            Toute reproduction, représentation, extraction, adaptation ou réutilisation non
            autorisée de tout ou partie du contenu de la plateforme est interdite, sauf autorisation
            écrite préalable de Troca ou des titulaires de droits concernés.
          </P>
        </Section>

        <Section title="5. Données personnelles">
          <P>
            Troca collecte et traite des données personnelles dans le cadre de la gestion des
            comptes, des annonces, de la messagerie, des alertes, de la vérification d’identité et
            de téléphone, de la modération, du service client, de la sécurité et de la facturation.
          </P>
          <P>
            Les modalités détaillées de collecte, de conservation, de suppression et d’exercice des
            droits sont précisées dans la{' '}
            <Link href="/confidentialite" className="text-coral underline">
              politique de confidentialité
            </Link>
            .
          </P>
        </Section>

        <Section title="6. Cookies et traceurs">
          <P>
            Troca utilise des cookies et technologies similaires nécessaires au bon fonctionnement
            du service. Si l’utilisateur y consent, une mesure d’audience first-party limitée peut
            être activée afin d’améliorer le produit. Aucune publicité ciblée n’est activée par
            défaut.
          </P>
          <P>
            Le consentement peut être modifié à tout moment depuis la bannière dédiée ou depuis
            la page <Link href="/parametres#cookies" className="text-coral underline">Paramètres &gt; Cookies</Link>.
          </P>
        </Section>

        <Section title="7. Responsabilité">
          <P>
            Troca met en œuvre des moyens raisonnables pour assurer le bon fonctionnement de la
            plateforme, sans pouvoir garantir une disponibilité continue ou l’absence totale
            d’erreurs, d’interruptions ou d’incidents techniques.
          </P>
          <P>
            Troca ne saurait être tenue responsable des contenus publiés par les utilisateurs, des
            transactions conclues entre eux, ni des dommages indirects résultant de l’utilisation
            de la plateforme, dans la limite autorisée par les règles d’ordre public applicables.
          </P>
        </Section>

        <Section title="8. Signalement et modération">
          <P>
            Troca met à disposition des utilisateurs des mécanismes de signalement permettant de
            notifier tout contenu ou comportement potentiellement illicite, trompeur, abusif ou
            contraire aux CGU.
          </P>
          <P>
            Troca peut, à ce titre, retirer, suspendre ou limiter l’accès à tout contenu ou compte
            ne respectant pas les règles applicables.
          </P>
        </Section>

        <Section title="9. Droit applicable">
          <P>
            Les présentes mentions légales sont régies par le droit applicable en Nouvelle-Calédonie
            et, le cas échéant, par le droit français pour les matières pour lesquelles il demeure
            applicable.
          </P>
        </Section>

        <Section title="10. Contact">
          <BulletList
            items={[
              'Contact général : contact@troca.nc',
              'Contact juridique : legal@troca.nc',
              'Contact vie privée / RGPD : dpo@troca.nc',
              'Contact sécurité : securite@troca.nc',
              'Adresse postale : [à compléter]',
            ]}
          />
        </Section>

        <div className="border-t border-night/10 pt-6 mt-8 flex flex-wrap gap-4 text-xs text-night/40">
          <span>© 2026 Troca SAS</span>
          <Link href="/confidentialite" className="hover:text-coral">
            Politique de confidentialité
          </Link>
          <Link href="/cgu" className="hover:text-coral">
            CGU
          </Link>
          <Link href="/parametres" className="hover:text-coral">
            Mes données
          </Link>
          <a href="mailto:legal@troca.nc" className="hover:text-coral">
            legal@troca.nc
          </a>
        </div>
      </main>
    </>
  )
}
