// src/app/cgu/page.tsx
// ── Conditions Générales d’Utilisation — Troca ────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Troca",
  description:
    "Conditions Générales d'Utilisation de la plateforme Troca, service de petites annonces en Nouvelle-Calédonie.",
}

const LAST_UPDATE = '20 mai 2026'

function Article({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8" id={`article-${num}`}>
      <h2 className="font-display font-bold text-xl text-night mb-4 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-coral text-white text-sm font-bold flex items-center justify-center shrink-0">
          {num}
        </span>
        {title}
      </h2>
      <div className="text-night/70 leading-relaxed space-y-3 pl-11 text-sm">{children}</div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="text-coral shrink-0 mt-0.5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function CguPage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-10">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-coral font-semibold">
            Conditions d’utilisation
          </p>
          <h1 className="font-display font-bold text-3xl text-night mt-2 mb-3">
            Conditions Générales d’Utilisation
          </h1>
          <p className="text-night/45 text-sm leading-relaxed">
            Dernière mise à jour : {LAST_UPDATE} · Version 1.0
          </p>
        </div>

        <div className="card p-5 mb-8 bg-coral/5 border-coral/20">
          <p className="text-sm text-night/70 leading-relaxed">
            Les présentes Conditions Générales d’Utilisation (ci-après les « CGU ») régissent
            l’accès et l’utilisation de la plateforme Troca, service de petites annonces en ligne
            destiné à la Nouvelle-Calédonie. En accédant à Troca, vous reconnaissez avoir lu,
            compris et accepté sans réserve les présentes CGU, ainsi que la politique de
            confidentialité et les mentions légales applicables.
          </p>
        </div>

        <nav className="card p-5 mb-8">
          <p className="font-semibold text-night text-sm mb-3">Sommaire</p>
          <ol className="space-y-1.5 text-sm text-coral">
            {[
              'Objet et champ d’application',
              'Définitions',
              'Accès à la plateforme et création de compte',
              'Annonces et contenus publiés',
              'Règles de conduite',
              'Transactions entre utilisateurs',
              'Services payants',
              'Responsabilité',
              'Propriété intellectuelle',
              'Données personnelles',
              'Durée, suspension et résiliation',
              'Droit applicable et règlement des litiges',
              'Contact',
            ].map((title, i) => (
              <li key={title}>
                <a href={`#article-${i + 1}`} className="hover:underline">
                  {i + 1}. {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Article num={1} title="Objet et champ d’application">
          <P>
            Troca est une plateforme de mise en relation entre utilisateurs particuliers et
            professionnels, leur permettant de publier, consulter et répondre à des annonces de
            biens, services, bons plans, évènements et trajets de covoiturage en Nouvelle-Calédonie.
          </P>
          <P>
            Les présentes CGU s’appliquent à tout usage de la plateforme, qu’il s’agisse du site
            internet ou de l’application mobile Troca.
          </P>
          <P>
            Troca se réserve le droit de modifier les CGU à tout moment, notamment pour tenir
            compte d’évolutions légales, techniques ou fonctionnelles. Les utilisateurs sont invités
            à les consulter régulièrement. L’utilisation continue de la plateforme après mise à
            jour vaut acceptation des CGU modifiées.
          </P>
        </Article>

        <Article num={2} title="Définitions">
          <Ul
            items={[
              '« Plateforme » : le site Troca et l’application mobile associée.',
              '« Utilisateur » : toute personne physique ou morale accédant à la Plateforme.',
              '« Membre » : Utilisateur disposant d’un compte Troca.',
              '« Annonce » : publication réalisée par un Membre.',
              '« Bon plan » : offre promotionnelle, coupon, vente flash, événement ou contenu local publié via la Plateforme.',
              '« Évènement » : annonce culturelle, associative ou communautaire proposant une date, un lieu ou une billetterie.',
              '« Covoiturage » : trajet proposé par un conducteur et réservé par un ou plusieurs passagers.',
              '« Vendeur » : Membre ayant publié une Annonce.',
              '« Acheteur » : Membre répondant à une Annonce ou contactant un Vendeur.',
              '« Contenu » : tout texte, image, vidéo, message ou donnée publiée par un Membre.',
              '« Service payant » : abonnement, option de visibilité, Bon plan ou toute offre promotionnelle payante.',
            ]}
          />
        </Article>

        <Article num={3} title="Accès à la plateforme et création de compte">
          <P>
            L’accès à certaines fonctionnalités de la Plateforme, notamment la publication
            d’annonces, la messagerie et certaines options de confiance, requiert la création d’un
            compte.
          </P>
          <P>
            L’utilisateur s’engage à fournir des informations exactes, complètes et à jour et à
            maintenir la confidentialité de ses identifiants. Il lui appartient de signaler sans
            délai toute utilisation non autorisée de son compte.
          </P>
          <P>
            Troca peut demander la vérification de l’adresse email et, selon les cas, du numéro de
            téléphone afin de renforcer la sécurité et la fiabilité des échanges.
          </P>
          <P>
            Troca se réserve le droit de refuser, suspendre ou supprimer tout compte comportant des
            informations manifestement inexactes, frauduleuses ou contraires aux présentes CGU.
          </P>
        </Article>

        <Article num={4} title="Annonces et contenus publiés">
          <P>
            Les annonces doivent présenter une description loyale, sincère et non trompeuse du bien,
            du service, du bon plan, de l'évènement ou du trajet proposé. Les prix doivent être
            exprimés en francs CFP (XPF) lorsqu’ils sont indiqués.
          </P>
          <P>
            L’utilisateur garantit disposer de tous les droits et autorisations nécessaires sur les
            contenus qu’il publie et s’interdit de publier tout contenu illicite, trompeur, abusif
            ou contraire à l’ordre public.
          </P>
          <P>
            Sont notamment interdits les contenus ou annonces portant sur des biens ou services
            illicites, frauduleux, dangereux, contrefaits ou réglementés sans les autorisations
            requises.
          </P>
          <P>
            Les annonces de covoiturage doivent respecter les règles de sécurité, d’assurance, de
            respect du Code de la route et de comportement attendu entre conducteur et passagers.
            Troca peut demander des éléments de confiance complémentaires et suspendre un trajet
            manifestement risqué, trompeur ou abusif.
          </P>
          <P>
            Troca peut retirer, modifier ou limiter la diffusion d’un contenu dès lors qu’il
            contrevient aux CGU, à la réglementation applicable ou aux intérêts légitimes de la
            communauté.
          </P>
        </Article>

        <Article num={5} title="Règles de conduite">
          <P>Chaque utilisateur s’engage à adopter un comportement loyal, respectueux et conforme à la loi.</P>
          <Ul
            items={[
              'Ne pas usurper l’identité d’un tiers.',
              'Ne pas publier plusieurs fois la même annonce sans motif légitime.',
              'Ne pas envoyer de messages abusifs, trompeurs ou non sollicités.',
              'Ne pas contourner les mécanismes de sécurité ou de modération de la Plateforme.',
              'Ne pas tenter de frauder, détourner ou manipuler les systèmes de paiement ou de visibilité.',
              'Ne pas porter atteinte aux droits des autres utilisateurs ou à la réputation de Troca.',
            ]}
          />
          <P>
            Tout comportement contraire aux présentes CGU peut entraîner la suppression d’un
            contenu, une limitation d’accès, une suspension temporaire ou une résiliation du
            compte.
          </P>
        </Article>

        <Article num={6} title="Transactions entre utilisateurs">
          <P>
            Troca agit comme intermédiaire technique de mise en relation. Troca n’est pas partie
            aux transactions conclues entre utilisateurs, n’intervient pas dans la négociation, la
            livraison ou le paiement des biens et services proposés, sauf disposition expresse
            contraire.
          </P>
          <P>
            Troca ne saurait être tenue responsable des désaccords, défauts de conformité, retards,
            non-livraisons, fraudes ou autres litiges intervenant entre utilisateurs.
          </P>
          <P>
            Il est recommandé aux utilisateurs de procéder aux vérifications d’usage avant toute
            transaction et de privilégier des échanges sécurisés.
          </P>
        </Article>

        <Article num={7} title="Services payants">
          <P>
            Troca peut proposer des services payants facultatifs, notamment des abonnements
            professionnels, des options de visibilité, des Boosts, des Bons plans, des services
            liés à des évènements ou des fonctionnalités additionnelles de mise en avant.
          </P>
          <P>
            Les prix applicables sont affichés avant validation de la commande. Les paiements sont
            traités par des prestataires de paiement sécurisés. Troca ne stocke pas les données
            bancaires complètes des utilisateurs.
          </P>
          <P>
            Sauf mention contraire ou disposition légale impérative, les services payants activés
            ne donnent pas lieu à remboursement après exécution ou activation du service.
          </P>
          <P>
            Les abonnements professionnels peuvent être soumis à renouvellement automatique.
            L’utilisateur peut résilier depuis son espace personnel, conformément aux conditions
            affichées au moment de la souscription.
          </P>
        </Article>

        <Article num={8} title="Responsabilité">
          <P>
            Troca s’efforce d’assurer la disponibilité, la sécurité et le bon fonctionnement de la
            Plateforme. Toutefois, Troca ne saurait garantir une disponibilité continue et
            ininterrompue.
          </P>
          <P>
            Troca ne saurait être tenue responsable des contenus publiés par les utilisateurs, des
            décisions prises par ceux-ci ni des conséquences des transactions conclues entre eux,
            dans la limite autorisée par la loi.
          </P>
          <P>
            La responsabilité de Troca ne peut être engagée qu’en cas de faute prouvée lui étant
            directement imputable et dans les limites prévues par le droit applicable.
          </P>
        </Article>

        <Article num={9} title="Propriété intellectuelle">
          <P>
            La Plateforme, ses éléments graphiques, ses interfaces, ses contenus éditoriaux, ses
            bases de données, ses marques et, plus généralement, l’ensemble des éléments
            protégés sont la propriété exclusive de Troca ou de ses partenaires.
          </P>
          <P>
            Toute reproduction, représentation, adaptation ou exploitation non autorisée de ces
            éléments est interdite.
          </P>
          <P>
            En publiant du contenu sur la Plateforme, l’utilisateur concède à Troca une licence non
            exclusive, mondiale, gratuite et limitée aux besoins de l’exploitation du service
            (affichage, modération, diffusion interne, promotion de la Plateforme).
          </P>
        </Article>

        <Article num={10} title="Données personnelles">
          <P>
            Les traitements de données personnelles effectués dans le cadre de l’utilisation de la
            Plateforme sont décrits dans la{' '}
            <Link href="/confidentialite" className="text-coral underline">
              Politique de confidentialité
            </Link>
            .
          </P>
          <P>
            L’utilisateur dispose notamment d’un droit d’accès, de rectification, d’effacement, de
            portabilité et d’opposition, dans les conditions prévues par la réglementation
            applicable.
          </P>
          <P>
            Les demandes peuvent être adressées depuis l’espace « Mes données (RGPD) » ou par
            courrier électronique à l’adresse dpo@troca.nc.
          </P>
          <P>
            Les règles applicables aux cookies, traceurs et à la mesure d’audience first-party
            sont précisées dans la politique de confidentialité et peuvent être ajustées à tout
            moment depuis la page{' '}
            <Link href="/parametres#cookies" className="text-coral underline">
              Paramètres &gt; Cookies
            </Link>
            .
          </P>
        </Article>

        <Article num={11} title="Durée, suspension et résiliation">
          <P>
            Les CGU s’appliquent pendant toute la durée d’utilisation du service.
          </P>
          <P>
            L’utilisateur peut mettre fin à son compte à tout moment depuis son espace personnel.
            La suppression du compte entraîne les effets prévus par la politique de
            confidentialité.
          </P>
          <P>
            Troca peut suspendre ou résilier l’accès à la Plateforme en cas de violation des CGU,
            de risque de fraude, d’usage abusif, d’atteinte à la sécurité du service ou de
            comportement préjudiciable aux autres utilisateurs.
          </P>
          <P>
            En matière de covoiturage, Troca peut également suspendre les comptes présentant un
            risque de sécurité, une activité suspecte, des avis frauduleux ou des signalements
            répétés.
          </P>
        </Article>

        <Article num={12} title="Droit applicable et règlement des litiges">
          <P>
            Les présentes CGU sont régies par le droit applicable en Nouvelle-Calédonie et, à
            défaut, par le droit français lorsque cela est pertinent.
          </P>
          <P>
            En cas de litige, les parties s’efforceront de rechercher une solution amiable avant
            toute action contentieuse. À défaut d’accord amiable, le litige sera soumis aux
            juridictions compétentes du ressort de Nouméa, sous réserve des règles impératives
            applicables.
          </P>
        </Article>

        <Article num={13} title="Contact">
          <P>Pour toute question relative aux présentes CGU, vous pouvez contacter Troca :</P>
          <Ul
            items={[
              'Email général : contact@troca.nc',
              'Email juridique : legal@troca.nc',
              'Email RGPD / DPO : dpo@troca.nc',
              'Email sécurité : securite@troca.nc',
            ]}
          />
        </Article>

        <div className="border-t border-night/10 pt-6 mt-8 flex flex-wrap gap-4 text-xs text-night/40">
          <span>© 2026 Troca</span>
          <Link href="/confidentialite" className="hover:text-coral">
            Politique de confidentialité
          </Link>
          <Link href="/parametres" className="hover:text-coral">
            Mes données (RGPD)
          </Link>
          <Link href="/mentions-legales" className="hover:text-coral">
            Mentions légales
          </Link>
          <a href="mailto:legal@troca.nc" className="hover:text-coral">
            legal@troca.nc
          </a>
        </div>
      </main>
    </>
  )
}
