// src/app/confidentialite/page.tsx
// ── Politique de confidentialité — Troca ─────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Troca',
  description:
    'Politique de confidentialité de Troca : données personnelles collectées, finalités, bases légales, conservation et droits RGPD.',
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

function DataTable({
  rows,
}: {
  rows: [string, string, string, string, string, string][]
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-night/10 bg-white shadow-sm">
      <table className="w-full min-w-[980px] text-xs">
        <thead>
          <tr className="bg-sand/70">
            {[
              'Donnée',
              'Où elle est collectée',
              'Pourquoi',
              'Stockage',
              'Conservation',
              'Base légale / suppression',
            ].map((header) => (
              <th key={header} className="text-left px-3 py-2.5 font-semibold text-night">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([donnee, collecte, pourquoi, stockage, retention, base], index) => (
            <tr key={donnee} className={index % 2 === 0 ? 'bg-white' : 'bg-sand/25'}>
              <td className="px-3 py-2.5 font-medium text-night align-top">{donnee}</td>
              <td className="px-3 py-2.5 text-night/65 align-top">{collecte}</td>
              <td className="px-3 py-2.5 text-night/65 align-top">{pourquoi}</td>
              <td className="px-3 py-2.5 text-night/65 align-top">{stockage}</td>
              <td className="px-3 py-2.5 text-night/65 align-top">{retention}</td>
              <td className="px-3 py-2.5 text-night/65 align-top">{base}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ConfidentialitePage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-10">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-coral font-semibold">
            Politique de confidentialité
          </p>
          <h1 className="font-display font-bold text-3xl text-night mt-2 mb-3">
            Politique de confidentialité et protection des données personnelles
          </h1>
          <p className="text-night/45 text-sm leading-relaxed">
            Dernière mise à jour : {LAST_UPDATE} · Responsable de traitement : Troca
          </p>
        </div>

        <div className="card p-5 mb-8 bg-jungle/5 border-jungle/15">
          <p className="text-sm text-night/70 leading-relaxed">
            Troca accorde une importance particulière à la protection de vos données personnelles.
            La présente politique a pour objet de vous informer, de manière claire et transparente,
            des conditions dans lesquelles vos données sont collectées, utilisées, conservées et
            protégées, conformément au Règlement général sur la protection des données (RGPD) et
            à la réglementation applicable en Nouvelle-Calédonie et, le cas échéant, en France.
          </p>
        </div>

        <Section title="1. Responsable de traitement et contact">
          <P>
            Le responsable de traitement est la structure éditrice de la plateforme Troca
            (ci-après « Troca »).
          </P>
          <P>
            Pour toute question relative à la protection des données, vous pouvez nous contacter à
            l’adresse suivante :{' '}
            <a href="mailto:dpo@troca.nc" className="text-coral underline">
              dpo@troca.nc
            </a>
          </P>
          <P>
            Les informations légales de la société éditrice, de l’hébergeur et des contacts
            juridiques figurent également dans la page{' '}
            <Link href="/mentions-legales" className="text-coral underline">
              Mentions légales
            </Link>
            .
          </P>
        </Section>

        <Section title="2. Catégories de données collectées">
          <P>
            Troca collecte uniquement les données nécessaires à la fourniture, à la sécurisation
            et à l’amélioration du service.
          </P>
          <DataTable
            rows={[
              [
                'Adresse email',
                'Inscription, connexion, vérification de compte, support, export RGPD',
                'Créer et authentifier le compte, envoyer les notifications de service',
                'Base utilisateurs, tokens de vérification, historique de facturation',
                'Tant que le compte est actif, puis anonymisation ou conservation légale',
                'Contrat, intérêt légitime, obligation légale pour la facturation',
              ],
              [
                'Numéro de téléphone',
                'Profil, vérification téléphone, support, confiance vendeur',
                'Sécurisation du compte et amélioration de la confiance',
                'Base utilisateurs, table de vérification téléphone',
                'Tant que le compte est actif, puis suppression à la fermeture du compte',
                'Contrat, intérêt légitime, consentement si utilisé pour des communications optionnelles',
              ],
              [
                'Adresse IP',
                'Requêtes RGPD, consentement cookies, sécurité serveur, journaux techniques',
                'Traçabilité, prévention de la fraude, preuve de consentement',
                'Logs RGPD, journaux techniques, éventuels logs d’infrastructure',
                'Durée limitée au besoin de sécurité et d’audit',
                'Intérêt légitime, obligation de preuve',
              ],
              [
                'Données de localisation',
                'Commune, province, filtres de recherche, permissions de localisation mobile, covoiturage',
                'Afficher des annonces locales, des offres de proximité, des évènements et situer les vendeurs ou conducteurs',
                'Tables communes/provinces, profil utilisateur, annonces',
                'Tant que le profil ou l’annonce existe',
                'Contrat, intérêt légitime, consentement si GPS précis activé',
              ],
              [
                'Identifiants de connexion sociale',
                'Connexion Google / Apple',
                'Simplifier l’authentification',
                'Table users',
                'Tant que le compte existe, puis anonymisation à la suppression',
                'Contrat, consentement implicite à l’usage du service',
              ],
              [
                'Photos et fichiers médias',
                'Profil, annonces, bons plans, évènements, conversations et trajets',
                'Illustrer les contenus et permettre l’échange entre utilisateurs',
                'Base de données des métadonnées + stockage local serveur',
                'Tant que le contenu associé existe, puis suppression selon les mécanismes disponibles',
                'Contrat, intérêt légitime',
              ],
              [
                'Données de messagerie',
                'Messages échangés entre utilisateurs',
                'Assurer la mise en relation et la gestion des litiges',
                'Table messages, éventuelles pièces jointes photo',
                'Tant que le compte ou la conversation existe, avec anonymisation partielle en cas de suppression',
                'Contrat, intérêt légitime',
              ],
              [
                'Données de paiement et de facturation',
                'Checkout, paiements Stripe / PayPlug, remboursements, factures',
                'Exécuter la prestation, suivre les transactions et respecter les obligations comptables',
                'Tables payments et billing_documents, données renvoyées par les prestataires',
                'Selon les obligations comptables et fiscales applicables',
                'Contrat, obligation légale',
              ],
              [
                'Tokens de notification',
                'Notifications push mobiles',
                'Envoyer les notifications liées au compte et à l’activité',
                'Table push_tokens',
                'Jusqu’à retrait du consentement, suppression du compte ou invalidation du token',
                'Consentement, contrat',
              ],
              [
                'Données comportementales',
                'Favoris, alertes de recherche, vues d’annonces, avis, partages, réservations, historique d’activité',
                'Améliorer l’expérience, la confiance et le fonctionnement du service',
                'Table favoris, search_alerts, annonces, avis, messages',
                'Tant que le compte ou le contenu concerné existe',
                'Contrat, intérêt légitime',
              ],
              [
                'Logs de sécurité et RGPD',
                'Demandes d’export, suppression de compte, journaux d’action',
                'Prouver l’exécution des demandes et assurer la sécurité',
                'Tables rgpd_logs, rgpd_consentements, webhook_events',
                'Conservation limitée au besoin de sécurité, d’audit et de preuve',
                'Intérêt légitime, obligation de preuve',
              ],
            ]}
          />
        </Section>

        <Section title="3. Finalités et bases légales">
          <P>Vos données sont traitées pour les finalités suivantes :</P>
          <BulletList
            items={[
              'Créer, gérer et sécuriser votre compte utilisateur.',
              'Publier, consulter, rechercher et modérer des annonces.',
              'Permettre les échanges entre utilisateurs via la messagerie.',
              'Vérifier votre adresse email et, le cas échéant, votre numéro de téléphone.',
              'Établir un niveau de confiance vendeur.',
              'Traiter les paiements, abonnements, remboursements et factures.',
              'Envoyer les notifications utiles au fonctionnement du service.',
              'Assurer la sécurité de la plateforme, prévenir la fraude et répondre aux obligations légales.',
            ]}
          />
          <P>
            Les traitements reposent, selon les cas, sur l’exécution du contrat, le consentement,
            l’intérêt légitime de Troca ou le respect d’une obligation légale.
          </P>
        </Section>

        <Section title="4. Destinataires et sous-traitants">
          <P>
            Les données peuvent être accessibles, dans la limite de leurs missions, aux équipes
            internes habilitées de Troca ainsi qu’à certains prestataires techniques et
            opérationnels nécessaires à la fourniture du service, notamment les prestataires
            d’hébergement, de paiement, d’envoi d’email et de notifications.
          </P>
          <P>
            Lorsque certains prestataires sont situés hors de l’Union européenne, Troca veille à la
            mise en place de garanties appropriées au sens du RGPD.
          </P>
        </Section>

        <Section title="5. Cookies et traceurs">
          <P>
            Troca utilise des cookies ou technologies similaires strictement nécessaires au
            fonctionnement du service. En cas d’acceptation, Troca peut enregistrer une mesure
            d’audience first-party limitée, portant sur les pages consultées et certaines actions
            utiles au produit. Aucune publicité ciblée n’est activée par défaut.
          </P>
          <P>
            Les préférences de consentement sont gérées via la bannière de cookies et peuvent être
            modifiées à tout moment par l’utilisateur depuis la bannière ou depuis la page{' '}
            <Link href="/parametres#cookies" className="text-coral underline">
              Paramètres &gt; Cookies
            </Link>
            .
          </P>
        </Section>

        <Section title="6. Durées de conservation">
          <BulletList
            items={[
              'Compte actif : conservation pendant toute la durée d’utilisation du service.',
              'Compte supprimé : anonymisation ou suppression selon la nature de la donnée.',
              'Données de facturation : conservation pendant la durée requise par les obligations comptables et fiscales.',
              'Logs de sécurité et RGPD : conservation limitée au besoin de traçabilité, de sécurité et de preuve.',
              'Événements analytics first-party : conservation maximale de 90 jours, puis purge automatique.',
              'Tokens de notification : suppression à la fermeture du compte ou à l’invalidation du token.',
              'Photos et médias : conservation tant que le contenu associé reste publié, puis suppression selon les mécanismes disponibles.',
            ]}
          />
          <P>
            Lorsque la réglementation impose une conservation plus longue, Troca peut conserver
            certaines données pendant la durée requise par la loi.
          </P>
        </Section>

        <Section title="7. Vos droits">
          <P>
            Conformément au RGPD, vous disposez notamment des droits d’accès, de rectification, de
            suppression, de limitation, d’opposition et de portabilité de vos données.
          </P>
          <P>
            Vous pouvez exercer ces droits depuis la page{' '}
            <Link href="/parametres" className="text-coral underline">
              Mes données (RGPD)
            </Link>{' '}
            ou en écrivant à{' '}
            <a href="mailto:dpo@troca.nc" className="text-coral underline">
              dpo@troca.nc
            </a>
            .
          </P>
          <P>
            Une réponse vous sera apportée dans les délais prévus par la réglementation en
            vigueur.
          </P>
        </Section>

        <Section title="8. Suppression du compte">
          <P>
            Vous pouvez demander la suppression de votre compte depuis la page{' '}
            <Link href="/parametres" className="text-coral underline">
              Paramètres
            </Link>
            . La suppression entraîne, selon les règles en vigueur :
          </P>
          <BulletList
            items={[
              'l’anonymisation ou la suppression du compte utilisateur ;',
              'la suppression des jetons de notification ;',
              'la suppression des alertes de recherche ;',
              'la désactivation des annonces actives ;',
              'l’anonymisation partielle de certains messages ;',
              'la conservation éventuelle de documents de facturation ou de logs lorsque la loi l’exige.',
            ]}
          />
          <P>
            Certaines données peuvent rester conservées de manière limitée lorsqu’une obligation
            légale, fiscale, comptable, probatoire ou de sécurité l’exige.
          </P>
        </Section>

        <Section title="9. Sécurité">
          <P>
            Troca met en œuvre des mesures techniques et organisationnelles raisonnables pour
            protéger vos données contre l’accès non autorisé, la divulgation, l’altération ou la
            perte.
          </P>
          <BulletList
            items={[
              'transmission sécurisée des échanges par HTTPS/TLS ;',
              'accès restreint aux données de production ;',
              'mécanismes d’authentification et de vérification ;',
              'journalisation de certaines opérations sensibles ;',
              'suppression des jetons de notification lors de la suppression du compte ;',
              'traitement des paiements par des prestataires spécialisés.',
            ]}
          />
          <P>
            Aucune mesure de sécurité ne pouvant offrir une garantie absolue, Troca s’engage à
            maintenir un niveau de protection adapté aux risques identifiés.
          </P>
        </Section>

        <Section title="10. Modifications de la politique">
          <P>
            La présente politique peut être mise à jour afin de tenir compte des évolutions
            légales, techniques ou opérationnelles. La version la plus récente est celle publiée
            sur cette page.
          </P>
        </Section>

        <div className="border-t border-night/10 pt-6 mt-8 flex flex-wrap gap-4 text-xs text-night/40">
          <span>© 2026 Troca</span>
          <Link href="/mentions-legales" className="hover:text-coral">
            Mentions légales
          </Link>
          <Link href="/cgu" className="hover:text-coral">
            CGU
          </Link>
          <Link href="/parametres" className="hover:text-coral">
            Mes données
          </Link>
          <a href="mailto:dpo@troca.nc" className="hover:text-coral">
            dpo@troca.nc
          </a>
        </div>
      </main>
    </>
  )
}
