'use client'
// ============================================================
//  Kalico  Champs dynamiques par catï¿½gorie
//  Apparaissent dans le formulaire de publication selon la catï¿½gorie choisie
// ============================================================

import type { FieldErrors, UseFormRegister } from 'react-hook-form'

export interface CategoryField {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'radio' | 'checkbox' | 'checkbox-group' | 'date'
  unit?: string
  placeholder?: string
  options?: { value: string; label: string }[]
  required?: boolean
  helper?: string
}

const VEHICLE_FIELDS: CategoryField[] = [
  { name: 'marque', label: 'Marque', type: 'text', placeholder: 'Toyota, Renault, Honda&', required: true },
  { name: 'modele', label: 'Modï¿½le', type: 'text', placeholder: 'Hilux, Clio, Jazz&', required: true },
  { name: 'annee', label: 'Annï¿½e', type: 'number', placeholder: '2020', required: true },
  { name: 'kilometrage', label: 'Kilomï¿½trage', type: 'number', unit: 'km', placeholder: '45000' },
  {
    name: 'carburant',
    label: 'Carburant',
    type: 'select',
    options: [
      { value: 'essence', label: 'Essence' },
      { value: 'diesel', label: 'Diesel' },
      { value: 'hybride', label: 'Hybride' },
      { value: 'electrique', label: 'ï¿½lectrique' },
      { value: 'gpl', label: 'GPL' },
    ],
  },
  {
    name: 'boite',
    label: 'Boï¿½te de vitesse',
    type: 'select',
    options: [
      { value: 'manuelle', label: 'Manuelle' },
      { value: 'automatique', label: 'Automatique' },
    ],
  },
]

const REAL_ESTATE_FIELDS: CategoryField[] = [
  { name: 'surface', label: 'Surface', type: 'number', unit: 'mï¿½', placeholder: '85', required: true },
  { name: 'nb_pieces', label: 'Nombre de piï¿½ces', type: 'number', placeholder: '3' },
  {
    name: 'type_bien',
    label: 'Type de bien',
    type: 'select',
    options: [
      { value: 'appartement', label: 'Appartement' },
      { value: 'maison', label: 'Maison / Villa' },
      { value: 'studio', label: 'Studio' },
      { value: 'bureau', label: 'Bureau / Local' },
      { value: 'terrain', label: 'Terrain' },
      { value: 'autre', label: 'Autre' },
    ],
    required: true,
  },
  {
    name: 'type_transaction',
    label: 'Transaction',
    type: 'select',
    options: [
      { value: 'vente', label: 'Vente' },
      { value: 'location', label: 'Location' },
      { value: 'colocation', label: 'Colocation' },
    ],
    required: true,
  },
]

const ELECTRONICS_FIELDS: CategoryField[] = [
  { name: 'marque', label: 'Marque', type: 'text', placeholder: 'Apple, Samsung, Sony&' },
  { name: 'modele', label: 'Modï¿½le', type: 'text', placeholder: 'iPhone 14, Galaxy S23&' },
  { name: 'stockage', label: 'Stockage / Capacitï¿½', type: 'text', placeholder: '256 Go, 1 To&' },
]

const EMPLOYMENT_FIELDS: CategoryField[] = [
  {
    name: 'type_contrat',
    label: 'Type de contrat',
    type: 'select',
    options: [
      { value: 'cdi', label: 'CDI' },
      { value: 'cdd', label: 'CDD' },
      { value: 'interim', label: 'Intï¿½rim' },
      { value: 'freelance', label: 'Freelance / Mission' },
      { value: 'stage', label: 'Stage / Alternance' },
      { value: 'autre', label: 'Autre' },
    ],
    required: true,
  },
  { name: 'secteur', label: "Secteur d'activitï¿½", type: 'text', placeholder: 'BTP, Commerce, Santï¿½&' },
  {
    name: 'experience',
    label: 'Expï¿½rience requise',
    type: 'select',
    options: [
      { value: 'debutant', label: 'Dï¿½butant acceptï¿½' },
      { value: '1_3', label: '13 ans' },
      { value: '3_5', label: '35 ans' },
      { value: '5_plus', label: '5 ans et plus' },
    ],
  },
]

const LOCATION_FIELDS: CategoryField[] = [
  {
    name: 'metadata.type_bien',
    label: 'Type de bien',
    type: 'select',
    required: true,
    options: [
      { value: 'bungalow', label: 'Bungalow' },
      { value: 'case', label: 'Case' },
      { value: 'appartement', label: 'Appartement' },
      { value: 'studio', label: 'Studio' },
      { value: 'maison', label: 'Maison' },
      { value: 'chambre', label: 'Chambre' },
    ],
  },
  { name: 'metadata.capacite_personnes', label: 'Capacitï¿½', type: 'number', required: true, placeholder: '4' },
  { name: 'metadata.nb_chambres', label: 'Nombre de chambres', type: 'number', placeholder: '2' },
  { name: 'metadata.surface_m2', label: 'Surface', type: 'number', unit: 'mï¿½', placeholder: '45' },
  { name: 'metadata.meuble', label: 'Meublï¿½', type: 'checkbox', helper: 'Activer si le logement est meublï¿½' },
  { name: 'metadata.prix_nuit_xpf', label: 'Prix par nuit', type: 'number', required: true, unit: 'XPF', placeholder: '8000' },
  { name: 'metadata.prix_semaine_xpf', label: 'Prix par semaine', type: 'number', unit: 'XPF', placeholder: '45000', helper: 'Suggï¿½rï¿½ = nuit ï¿½ 6' },
  { name: 'metadata.disponible_du', label: 'Disponible du', type: 'date' },
  { name: 'metadata.disponible_au', label: 'Disponible au', type: 'date' },
  {
    name: 'metadata.equipements',
    label: 'ï¿½quipements',
    type: 'checkbox-group',
    options: [
      { value: 'wifi', label: 'Wifi' },
      { value: 'climatisation', label: 'Climatisation' },
      { value: 'piscine', label: 'Piscine' },
      { value: 'barbecue', label: 'Barbecue' },
      { value: 'parking', label: 'Parking' },
      { value: 'vue_mer', label: 'Vue mer' },
      { value: 'cuisine_equipee', label: 'Cuisine ï¿½quipï¿½e' },
      { value: 'lave_linge', label: 'Lave-linge' },
    ],
  },
  { name: 'metadata.animaux_acceptes', label: 'Animaux acceptï¿½s', type: 'checkbox' },
  { name: 'metadata.fumeurs_acceptes', label: 'Fumeurs acceptï¿½s', type: 'checkbox' },
  { name: 'metadata.localisation_precise', label: 'Localisation prï¿½cise', type: 'text', placeholder: 'Quartier, lieu-dit&' },
]

const SERVICES_FIELDS: CategoryField[] = [
  {
    name: 'metadata.type_service',
    label: 'Type de service',
    type: 'select',
    required: true,
    options: [
      { value: 'jardinage', label: 'Jardinage' },
      { value: 'plomberie', label: 'Plomberie' },
      { value: 'electricite', label: 'ï¿½lectricitï¿½' },
      { value: 'menage', label: 'Mï¿½nage' },
      { value: 'baby_sitting', label: 'Baby-sitting' },
      { value: 'cours_particuliers', label: 'Cours particuliers' },
      { value: 'informatique', label: 'Informatique' },
      { value: 'couture', label: 'Couture' },
      { value: 'transport', label: 'Transport' },
      { value: 'renovation', label: 'Rï¿½novation' },
      { value: 'autre', label: 'Autre' },
    ],
  },
  { name: 'metadata.type_service_autre', label: 'Prï¿½cisez', type: 'text', placeholder: 'Saisie libre si autre service' },
  {
    name: 'metadata.tarif_type',
    label: 'Tarification',
    type: 'radio',
    required: true,
    options: [
      { value: 'heure', label: 'Au tarif horaire' },
      { value: 'forfait', label: 'Forfait' },
      { value: 'a_negocier', label: 'ï¿½ nï¿½gocier' },
    ],
  },
  { name: 'metadata.tarif_xpf', label: 'Tarif', type: 'number', unit: 'XPF', placeholder: '2500' },
  { name: 'metadata.tarif_description', label: 'Description du tarif', type: 'text', placeholder: 'ï¿½ partir de 2 500 XPF / h selon la complexitï¿½' },
  { name: 'metadata.zone_intervention', label: 'Zone dintervention', type: 'text', required: true, placeholder: 'NoumÃ©a, DumbÃ©a, Mont-Dore' },
  {
    name: 'metadata.disponibilite',
    label: 'Disponibilitï¿½',
    type: 'radio',
    options: [
      { value: 'semaine', label: 'Semaine' },
      { value: 'weekend', label: 'Week-end' },
      { value: 'les_deux', label: 'Les deux' },
    ],
  },
  { name: 'metadata.experience_annees', label: 'Expï¿½rience', type: 'number', placeholder: '5' },
  { name: 'metadata.diplome_certifie', label: 'Certifiï¿½ / diplï¿½mï¿½', type: 'checkbox', helper: 'Afficher ce badge sur la carte' },
]

const DON_FIELDS: CategoryField[] = [
  {
    name: 'metadata.etat',
    label: "Ãtat de l'objet",
    type: 'radio',
    required: true,
    options: [
      { value: 'bon', label: 'Bon Ãtat' },
      { value: 'usage', label: 'Usage' },
      { value: 'a_reparer', label: 'ï¿½ rï¿½parer' },
    ],
  },
  {
    name: 'metadata.raison_don',
    label: 'Raison du don',
    type: 'select',
    options: [
      { value: 'demenagement', label: 'Dï¿½mï¿½nagement' },
      { value: 'surplus', label: 'Surplus' },
      { value: 'upgrade', label: 'Upgrade' },
      { value: 'autre', label: 'Autre' },
    ],
  },
  { name: 'metadata.commune_remise', label: 'Commune de remise', type: 'text', required: true, placeholder: 'NoumÃ©a' },
  { name: 'metadata.remise_en_main_propre', label: 'Remise en main propre', type: 'checkbox', helper: 'Les dons restent en remise directe' },
]

const IMMOBILIER_V2_FIELDS: CategoryField[] = [
  {
    name: 'metadata.transaction',
    label: 'Transaction',
    type: 'radio',
    required: true,
    options: [
      { value: 'vente', label: 'Vente' },
      { value: 'location_longue_duree', label: 'Location longue durï¿½e' },
    ],
  },
  {
    name: 'metadata.type_bien',
    label: 'Type de bien',
    type: 'select',
    required: true,
    options: [
      { value: 'appartement', label: 'Appartement' },
      { value: 'maison', label: 'Maison' },
      { value: 'villa', label: 'Villa' },
      { value: 'terrain', label: 'Terrain' },
      { value: 'local_commercial', label: 'Local commercial' },
      { value: 'immeuble', label: 'Immeuble' },
      { value: 'parking', label: 'Parking' },
      { value: 'case', label: 'Case' },
    ],
  },
  { name: 'metadata.surface_m2', label: 'Surface (mï¿½)', type: 'number', required: true, placeholder: '85' },
  { name: 'metadata.nb_pieces', label: 'Nombre de piï¿½ces', type: 'number', required: true, placeholder: '3' },
  { name: 'metadata.nb_chambres', label: 'Nombre de chambres', type: 'number', placeholder: '2' },
  { name: 'metadata.nb_sdb', label: 'Nombre de salles de bain', type: 'number', placeholder: '1' },
  { name: 'metadata.etage', label: 'ï¿½tage', type: 'number', placeholder: '2' },
  { name: 'metadata.nb_etages_total', label: "Nombre d'ï¿½tages total", type: 'number', placeholder: '5' },
  { name: 'metadata.meuble', label: 'Meublï¿½', type: 'checkbox' },
  { name: 'metadata.parking', label: 'Parking', type: 'checkbox' },
  { name: 'metadata.nb_places_parking', label: 'Nombre de places parking', type: 'number', placeholder: '1' },
  { name: 'metadata.annee_construction', label: 'Annï¿½e de construction', type: 'number', placeholder: '1998' },
  {
    name: 'metadata.etat_bien',
    label: 'Ãtat du bien',
    type: 'radio',
    options: [
      { value: 'neuf', label: 'Neuf' },
      { value: 'bon', label: 'Bon Ãtat' },
      { value: 'a_renover', label: 'ï¿½ rï¿½nover' },
    ],
  },
  {
    name: 'metadata.dpe',
    label: 'DPE',
    type: 'select',
    options: [
      { value: 'A', label: 'A' },
      { value: 'B', label: 'B' },
      { value: 'C', label: 'C' },
      { value: 'D', label: 'D' },
      { value: 'E', label: 'E' },
      { value: 'F', label: 'F' },
      { value: 'G', label: 'G' },
      { value: 'NC', label: 'NC' },
    ],
  },
  { name: 'metadata.charges_mensuelles_xpf', label: 'Charges mensuelles', type: 'number', unit: 'XPF', placeholder: '15000' },
  { name: 'metadata.depot_garantie_xpf', label: 'Dï¿½pï¿½t de garantie', type: 'number', unit: 'XPF', placeholder: '60000' },
  { name: 'metadata.disponible_le', label: 'Disponible le', type: 'date' },
  {
    name: 'metadata.equipements',
    label: 'ï¿½quipements',
    type: 'checkbox-group',
    options: [
      { value: 'climatisation', label: 'Climatisation' },
      { value: 'piscine', label: 'Piscine' },
      { value: 'parking', label: 'Parking' },
      { value: 'terrasse', label: 'Terrasse / Balcon' },
      { value: 'jardin', label: 'Jardin' },
      { value: 'gardien', label: 'Gardien' },
      { value: 'digicode', label: 'Digicode' },
      { value: 'fibre', label: 'Fibre optique' },
    ],
  },
  {
    name: 'metadata.exposition',
    label: 'Exposition',
    type: 'select',
    options: [
      { value: 'nord', label: 'Nord' },
      { value: 'sud', label: 'Sud' },
      { value: 'est', label: 'Est' },
      { value: 'ouest', label: 'Ouest' },
      { value: 'nord_est', label: 'Nord-Est' },
      { value: 'nord_ouest', label: 'Nord-Ouest' },
      { value: 'sud_est', label: 'Sud-Est' },
      { value: 'sud_ouest', label: 'Sud-Ouest' },
    ],
  },
]

// Map catï¿½gorie slug ï¿½ champs
const CATEGORY_FIELDS: Record<string, CategoryField[]> = {
  vehicules: VEHICLE_FIELDS,
  voitures: VEHICLE_FIELDS,
  motos: VEHICLE_FIELDS,
  bateaux: VEHICLE_FIELDS,
  immobilier: REAL_ESTATE_FIELDS,
  'maisons-villas': REAL_ESTATE_FIELDS,
  appartements: REAL_ESTATE_FIELDS,
  location_courte_duree: LOCATION_FIELDS,
  locations: LOCATION_FIELDS,
  services: SERVICES_FIELDS,
  don: DON_FIELDS,
  dons: DON_FIELDS,
  multimedia: ELECTRONICS_FIELDS,
  electronique: ELECTRONICS_FIELDS,
  informatique: ELECTRONICS_FIELDS,
  emploi: EMPLOYMENT_FIELDS,
  offres_emploi: EMPLOYMENT_FIELDS,
  vente: IMMOBILIER_V2_FIELDS,
  'location-longue-duree': IMMOBILIER_V2_FIELDS,
}

export function getCategoryFields(categorySlug: string): CategoryField[] {
  return CATEGORY_FIELDS[categorySlug?.toLowerCase()] ?? []
}

function snapTo10(value: string | number) {
  const parsed = typeof value === 'number' ? value : Number(String(value || '').trim())
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.round(parsed / 10) * 10)
}

function getFieldError(errors: FieldErrors<any>, path: string): string | undefined {
  const segments = path.split('.')
  let current: unknown = errors

  for (const segment of segments) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }

  const message = (current as { message?: unknown } | undefined)?.message
  return typeof message === 'string' ? message : undefined
}

interface Props {
  categorySlug: string
  register: UseFormRegister<any>
  errors: FieldErrors<any>
}

export default function CategoryFields({ categorySlug, register, errors }: Props) {
  const fields = getCategoryFields(categorySlug)
  if (!fields.length) return null

  return (
    <div className="border-t border-night/8 pt-6 mt-2">
      <p className="text-sm font-semibold text-night mb-4 flex items-center gap-2">
        <span className="w-5 h-5 bg-kalico-blue/10 text-kalico-blue rounded-full flex items-center justify-center text-xs">&</span>
        Caractï¿½ristiques spï¿½cifiques
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => {
          const errorMessage = getFieldError(errors, field.name)
          const isNumber = field.type === 'number'
          const isTextLike = field.type === 'text' || field.type === 'number'
          const isMoneyField = field.type === 'number' && (field.unit?.toUpperCase() === 'XPF' || /_xpf$/i.test(field.name))
          const fieldRegister = register(field.name, {
            ...(field.required ? { required: `${field.label} est requis.` } : undefined),
            valueAsNumber: isNumber,
          })
          const registerOptions = field.required
            ? { required: `${field.label} est requis.` }
            : undefined

          return (
            <div key={field.name}>
              <label className="block text-sm font-medium text-night/70 mb-1.5">
                {field.label}
                {field.required && <span className="text-kalico-blue ml-1">*</span>}
              </label>

              {field.type === 'select' && (
                <select
                  {...register(field.name, registerOptions)}
                  className={`input w-full ${errorMessage ? 'border-[var(--color-danger)]/30' : ''}`}
                >
                  <option value="">Choisir une option</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}

              {field.type === 'textarea' && (
                <textarea
                  {...register(field.name, registerOptions)}
                  placeholder={field.placeholder}
                  className={`input w-full min-h-[110px] ${errorMessage ? 'border-[var(--color-danger)]/30' : ''}`}
                />
              )}

              {field.type === 'date' && (
                <input
                  {...register(field.name, registerOptions)}
                  type="date"
                  className={`input w-full ${errorMessage ? 'border-[var(--color-danger)]/30' : ''}`}
                />
              )}

              {field.type === 'radio' && (
                <div className="flex flex-wrap gap-2">
                  {field.options?.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 rounded-full border border-night/10 bg-white px-3 py-2 text-sm text-night/80"
                    >
                      <input type="radio" value={opt.value} {...register(field.name, registerOptions)} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'checkbox' && (
                <label className="flex items-center gap-2 rounded-xl border border-night/10 bg-white px-3 py-3 text-sm text-night/80">
                  <input type="checkbox" {...register(field.name, registerOptions)} />
                  <span>{field.helper || 'Activer'}</span>
                </label>
              )}

              {field.type === 'checkbox-group' && (
                <div className="flex flex-wrap gap-2">
                  {field.options?.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 rounded-full border border-night/10 bg-white px-3 py-2 text-sm text-night/80"
                    >
                      <input type="checkbox" value={opt.value} {...register(field.name, registerOptions)} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {isTextLike && (
                <div className="relative">
                  <input
                    {...fieldRegister}
                    type={field.type}
                    step={isMoneyField ? 10 : undefined}
                    placeholder={field.placeholder}
                    onBlur={(event) => {
                      fieldRegister.onBlur(event)
                      if (!isMoneyField) return
                      const snapped = snapTo10((event.target as HTMLInputElement).value)
                      fieldRegister.onChange({
                        ...event,
                        target: { ...event.target, value: String(snapped), name: field.name },
                      } as any)
                    }}
                    className={`input w-full ${field.unit ? 'pr-12' : ''} ${errorMessage ? 'border-[var(--color-danger)]/30' : ''}`}
                  />
                  {field.unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-night/40 select-none">
                      {field.unit}
                    </span>
                  )}
                </div>
              )}

              {field.helper && field.type !== 'checkbox' && (
                <p className="text-[11px] text-night/40 mt-1">{field.helper}</p>
              )}

              {errorMessage && (
                <p className="text-xs text-[var(--color-danger)] mt-1">{errorMessage}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
