'use client'
// ============================================================
//  Troca — Champs dynamiques par catégorie
//  Apparaissent dans le formulaire de publication selon la catégorie choisie
// ============================================================

import type { UseFormRegister, FieldErrors } from 'react-hook-form'

// ── Définition des champs par catégorie ───────────────────────
// Chaque catégorie a des champs spécifiques avec leur type et validation

export interface CategoryField {
  name:        string
  label:       string
  type:        'text' | 'number' | 'select'
  unit?:       string
  placeholder?: string
  options?:    { value: string; label: string }[]
  required?:   boolean
}

const VEHICLE_FIELDS: CategoryField[] = [
  {
    name: 'marque', label: 'Marque', type: 'text',
    placeholder: 'Toyota, Renault, Honda…', required: true,
  },
  {
    name: 'modele', label: 'Modèle', type: 'text',
    placeholder: 'Hilux, Clio, Jazz…', required: true,
  },
  {
    name: 'annee', label: 'Année', type: 'number',
    placeholder: '2020', required: true,
  },
  {
    name: 'kilometrage', label: 'Kilométrage', type: 'number',
    unit: 'km', placeholder: '45000',
  },
  {
    name: 'carburant', label: 'Carburant', type: 'select',
    options: [
      { value: 'essence',  label: 'Essence' },
      { value: 'diesel',   label: 'Diesel' },
      { value: 'hybride',  label: 'Hybride' },
      { value: 'electrique', label: 'Électrique' },
      { value: 'gpl',      label: 'GPL' },
    ],
  },
  {
    name: 'boite', label: 'Boîte de vitesse', type: 'select',
    options: [
      { value: 'manuelle',     label: 'Manuelle' },
      { value: 'automatique',  label: 'Automatique' },
    ],
  },
]

const REAL_ESTATE_FIELDS: CategoryField[] = [
  {
    name: 'surface', label: 'Surface', type: 'number',
    unit: 'm²', placeholder: '85', required: true,
  },
  {
    name: 'nb_pieces', label: 'Nombre de pièces', type: 'number',
    placeholder: '3',
  },
  {
    name: 'type_bien', label: 'Type de bien', type: 'select',
    options: [
      { value: 'appartement', label: 'Appartement' },
      { value: 'maison',      label: 'Maison / Villa' },
      { value: 'studio',      label: 'Studio' },
      { value: 'bureau',      label: 'Bureau / Local' },
      { value: 'terrain',     label: 'Terrain' },
      { value: 'autre',       label: 'Autre' },
    ],
    required: true,
  },
  {
    name: 'type_transaction', label: 'Transaction', type: 'select',
    options: [
      { value: 'vente',     label: 'Vente' },
      { value: 'location',  label: 'Location' },
      { value: 'colocation', label: 'Colocation' },
    ],
    required: true,
  },
]

const ELECTRONICS_FIELDS: CategoryField[] = [
  {
    name: 'marque', label: 'Marque', type: 'text',
    placeholder: 'Apple, Samsung, Sony…',
  },
  {
    name: 'modele', label: 'Modèle', type: 'text',
    placeholder: 'iPhone 14, Galaxy S23…',
  },
  {
    name: 'stockage', label: 'Stockage / Capacité', type: 'text',
    placeholder: '256 Go, 1 To…',
  },
]

const EMPLOYMENT_FIELDS: CategoryField[] = [
  {
    name: 'type_contrat', label: 'Type de contrat', type: 'select',
    options: [
      { value: 'cdi',        label: 'CDI' },
      { value: 'cdd',        label: 'CDD' },
      { value: 'interim',    label: 'Intérim' },
      { value: 'freelance',  label: 'Freelance / Mission' },
      { value: 'stage',      label: 'Stage / Alternance' },
      { value: 'autre',      label: 'Autre' },
    ],
    required: true,
  },
  {
    name: 'secteur', label: 'Secteur d\'activité', type: 'text',
    placeholder: 'BTP, Commerce, Santé…',
  },
  {
    name: 'experience', label: 'Expérience requise', type: 'select',
    options: [
      { value: 'debutant',  label: 'Débutant accepté' },
      { value: '1_3',       label: '1–3 ans' },
      { value: '3_5',       label: '3–5 ans' },
      { value: '5_plus',    label: '5 ans et plus' },
    ],
  },
]

// ── Map catégorie slug → champs ───────────────────────────────

const CATEGORY_FIELDS: Record<string, CategoryField[]> = {
  vehicules:       VEHICLE_FIELDS,
  voitures:        VEHICLE_FIELDS,
  motos:           VEHICLE_FIELDS,
  bateaux:         VEHICLE_FIELDS,
  immobilier:      REAL_ESTATE_FIELDS,
  'maisons-villas': REAL_ESTATE_FIELDS,
  appartements:    REAL_ESTATE_FIELDS,
  multimedia:      ELECTRONICS_FIELDS,
  electronique:    ELECTRONICS_FIELDS,
  informatique:    ELECTRONICS_FIELDS,
  emploi:          EMPLOYMENT_FIELDS,
  offres_emploi:   EMPLOYMENT_FIELDS,
}

export function getCategoryFields(categorySlug: string): CategoryField[] {
  return CATEGORY_FIELDS[categorySlug?.toLowerCase()] ?? []
}

// ── Composant ─────────────────────────────────────────────────

interface Props {
  categorySlug: string
  register:     UseFormRegister<any>
  errors:       FieldErrors<any>
}

export default function CategoryFields({ categorySlug, register, errors }: Props) {
  const fields = getCategoryFields(categorySlug)
  if (!fields.length) return null

  return (
    <div className="border-t border-night/8 pt-6 mt-2">
      <p className="text-sm font-semibold text-night mb-4 flex items-center gap-2">
        <span className="w-5 h-5 bg-coral/10 text-coral rounded-full flex items-center justify-center text-xs">✦</span>
        Caractéristiques spécifiques
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-night/70 mb-1.5">
              {field.label}
              {field.required && <span className="text-coral ml-1">*</span>}
            </label>

            {field.type === 'select' ? (
              <select
                {...register(field.name)}
                className={`input w-full ${errors[field.name] ? 'border-red-400' : ''}`}
              >
                <option value="">— Choisir —</option>
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <input
                  {...register(field.name, {
                    valueAsNumber: field.type === 'number',
                  })}
                  type={field.type}
                  placeholder={field.placeholder}
                  className={`input w-full ${field.unit ? 'pr-12' : ''} ${errors[field.name] ? 'border-red-400' : ''}`}
                />
                {field.unit && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-night/40 select-none">
                    {field.unit}
                  </span>
                )}
              </div>
            )}

            {errors[field.name] && (
              <p className="text-xs text-red-500 mt-1">
                {errors[field.name]?.message as string}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
