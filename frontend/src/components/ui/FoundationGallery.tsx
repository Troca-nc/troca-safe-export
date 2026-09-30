'use client'
import { useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Input, Select, Textarea } from './Field'
import {
  Checkbox,
  Radio,
  Switch,
  FilterChip,
  SegmentedControl,
} from './Controls'
import { Badge, ProBadge } from './Badge'
import { Card, DeepPanel } from './Card'
import { Modal } from './Modal'
import { LoadingState, ErrorState } from './Skeleton'
import { MobileEmptyState } from './EmptyStates'

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex min-w-0 flex-col gap-6 border-t border-sand pt-8"
    >
      <h2
        id={id}
        className="font-display text-[30px] font-normal text-ink lg:text-h2"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
export function FoundationGallery() {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState(false)
  const [segment, setSegment] = useState('list')
  const [retry, setRetry] = useState(false)
  return (
    <main
      className="mx-auto flex w-full max-w-container flex-col gap-12 bg-cream px-5 py-12 font-body text-body-sm text-ink sm:px-8 lg:px-12"
      data-testid="foundation-gallery"
    >
      <header className="flex flex-col gap-4">
        <p className="text-eyebrow uppercase text-accent-text">
          Kalico · système visuel
        </p>
        <h1 className="font-display text-[38px] font-normal leading-tight sm:text-[52px] lg:text-h1">
          Les fondations
        </h1>
        <p className="max-w-prose text-body">
          Bibliothèque de composants et d’états. Les contrôles de cette page
          servent uniquement à vérifier les interactions.
        </p>
      </header>
      <Section id="palette" title="Palette et typographie">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-eyebrow uppercase text-accent-text">Action</p>
            <p className="mt-3 font-display text-h3">Accent</p>
            <div className="mt-4 h-12 rounded-control bg-accent-strong" />
          </Card>
          <Card>
            <p className="text-eyebrow uppercase text-ink">Structure</p>
            <p className="mt-3 font-display text-h3">Encre</p>
            <div className="mt-4 h-12 rounded-control bg-ink" />
          </Card>
          <Card>
            <p className="text-eyebrow uppercase text-lagoon-text">
              Information
            </p>
            <p className="mt-3 font-display text-h3">Lagon</p>
            <div className="mt-4 h-12 rounded-control bg-lagoon" />
          </Card>
          <Card>
            <p className="text-eyebrow uppercase text-reef-text">Confiance</p>
            <p className="mt-3 font-display text-h3">Récif</p>
            <div className="mt-4 h-12 rounded-control bg-reef" />
          </Card>
        </div>
        <p className="font-mono text-meta text-ink/70">
          Instrument Serif · IBM Plex Sans · IBM Plex Mono
        </p>
      </Section>
      <Section id="buttons" title="Boutons">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Action principale</Button>
          <Button variant="secondary">Action secondaire</Button>
          <Button variant="tertiary">Action tertiaire</Button>
          <Button variant="ghost">Action discrète</Button>
          <Button compact>Compact</Button>
          <Button disabled>Indisponible</Button>
          <Button loading>Envoyer le formulaire</Button>
        </div>
        <p className="text-meta text-ink/70">
          Survolez les contrôles et utilisez Tab pour vérifier le focus visible.
        </p>
      </Section>
      <Section id="fields" title="Champs">
        <div className="grid items-start gap-6 md:grid-cols-2">
          <Input
            label="Adresse e-mail"
            type="email"
            placeholder="vous@exemple.nc"
            hint="Utilisez une adresse de démonstration."
          />
          <Input
            label="Téléphone (+687)"
            type="tel"
            prefix="+687"
            placeholder="00 00 00"
          />
          <Input label="Montant (XPF)" type="number" suffix="XPF" min="0" />
          <Input label="Champ désactivé" disabled placeholder="Indisponible" />
          <Input
            label="Champ en erreur"
            error="Ce champ est requis."
            required
          />
          <Select
            label="Sélection en erreur"
            error="Sélectionnez une option."
            defaultValue=""
          >
            <option value="">Choisir</option>
            <option value="option">Option disponible</option>
          </Select>
          <Textarea label="Texte désactivé" disabled rows={3} />
          <Select label="Affichage">
            <option>Vue standard</option>Vue compacte
          </Select>
          <Textarea
            label="Description"
            hint="Cinq lignes, redimensionnement vertical."
          />
          <div className="flex flex-col gap-6">
            <Select label="Sélection désactivée" disabled>
              <option>Indisponible</option>
            </Select>
            <Textarea
              label="Texte en erreur"
              error="Ajoutez une description."
              rows={3}
            />
          </div>
        </div>
      </Section>
      <Section id="controls" title="Sélection et filtres">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Checkbox label="Accepter cette option" />
            <Checkbox label="Option cochée" defaultChecked />
            <Checkbox label="Option désactivée" disabled />
            <Checkbox
              label="Option requise"
              error="Sélectionnez cette option pour continuer."
            />
          </div>
          <fieldset>
            <legend className="mb-2 text-label-sm font-semibold">
              Choix unique
            </legend>
            <Radio name="gallery-radio" label="Premier choix" defaultChecked />
            <Radio name="gallery-radio" label="Second choix" />
            <Radio name="gallery-radio" label="Choix indisponible" disabled />
            <Radio
              name="gallery-radio-error"
              label="Choix requis"
              error="Sélectionnez un choix."
            />
          </fieldset>
          <div className="flex flex-col gap-2">
            <Switch label="Activer cette option" />
            <Switch label="Interrupteur actif" defaultChecked />
            <Switch label="Interrupteur désactivé" disabled />
            <Switch
              label="Interrupteur en erreur"
              error="Activez cette option pour continuer."
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <FilterChip selected={filter} onClick={() => setFilter(!filter)}>
                Filtre interactif
              </FilterChip>
              <FilterChip selected disabled>
                Filtre indisponible
              </FilterChip>
            </div>
            <SegmentedControl
              label="Mode de présentation"
              value={segment}
              onChange={setSegment}
              options={[
                { value: 'list', label: 'Liste' },
                { value: 'grid', label: 'Grille' },
                { value: 'map', label: 'Carte', disabled: true },
              ]}
            />
          </div>
        </div>
      </Section>
      <Section id="badges" title="Badges">
        <div className="flex flex-wrap gap-3">
          <Badge tone="success">Succès</Badge>
          <Badge tone="info">Information</Badge>
          <Badge tone="warning">À vérifier</Badge>
          <Badge tone="error">Erreur</Badge>
          <Badge>Neutre</Badge>
          <ProBadge />
        </div>
      </Section>
      <Section id="cards" title="Surfaces">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="font-display text-h3">Une surface claire</h3>
            <p className="mt-4">
              Bordure sable, ombre légère et contenu lisible.
            </p>
          </Card>
          <DeepPanel>
            <p className="text-eyebrow uppercase text-accent">Sur fond récif</p>
            <h3 className="mt-3 font-display text-h3 font-normal">
              Un bloc sombre
            </h3>
            <p className="mt-4 text-cream/80">
              Une texture discrète accompagne le contenu.
            </p>
          </DeepPanel>
        </div>
      </Section>
      <Section id="states" title="Chargement, vide et erreur">
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <Card>
            <LoadingState />
          </Card>
          <MobileEmptyState variant="generic" onCta={() => setRetry(true)} />
          <ErrorState
            message="Le chargement de cet exemple a échoué."
            onRetry={() => setRetry(true)}
          />
        </div>
        {retry && (
          <p role="status" className="text-reef-text">
            Nouvelle tentative déclenchée dans la galerie.
          </p>
        )}
      </Section>
      <Section id="modal" title="Fenêtre modale">
        <div>
          <Button onClick={() => setOpen(true)}>Ouvrir la modale</Button>
        </div>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Vérifier une action"
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Confirmer</Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Annuler
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-5">
            <p>
              Le focus reste dans la fenêtre. Échap la ferme et rend le focus au
              déclencheur.
            </p>
            <Input label="Libellé de vérification" />
          </div>
        </Modal>
      </Section>
    </main>
  )
}
