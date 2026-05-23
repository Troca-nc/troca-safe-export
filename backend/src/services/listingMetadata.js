'use strict';

const Joi = require('joi');

const LOCATION_EQUIPMENT_VALUES = [
  'wifi',
  'climatisation',
  'piscine',
  'barbecue',
  'parking',
  'vue_mer',
  'cuisine_equipee',
  'lave_linge',
];

const SERVICE_TYPES = [
  'jardinage',
  'plomberie',
  'electricite',
  'menage',
  'baby_sitting',
  'cours_particuliers',
  'informatique',
  'couture',
  'transport',
  'renovation',
  'autre',
];

const SERVICE_AVAILABILITY = ['semaine', 'weekend', 'les_deux'];
const SERVICE_TARIFF_TYPES = ['heure', 'forfait', 'a_negocier'];
const IMMOBILIER_TYPES = ['appartement', 'maison', 'villa', 'terrain', 'local_commercial', 'immeuble', 'parking', 'case'];
const IMMOBILIER_TRANSACTION_TYPES = ['vente', 'location_longue_duree'];
const IMMOBILIER_CONDITIONS = ['neuf', 'bon', 'a_renover'];
const IMMOBILIER_DPE = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'NC'];
const IMMOBILIER_EXPOSURES = ['nord', 'sud', 'est', 'ouest', 'nord_est', 'nord_ouest', 'sud_est', 'sud_ouest'];

function normalizeCategorySlug(value) {
  const slug = String(value || '').trim().toLowerCase();
  if (slug === 'locations') return 'location_courte_duree';
  if (slug === 'dons') return 'don';
  return slug;
}

function buildLocationSchema() {
  return Joi.object({
    type_bien: Joi.string().valid('bungalow', 'case', 'appartement', 'studio', 'maison', 'chambre').required(),
    capacite_personnes: Joi.number().integer().min(1).max(12).required(),
    nb_chambres: Joi.number().integer().min(0).max(6).default(0),
    surface_m2: Joi.number().integer().min(1).max(2000).optional(),
    meuble: Joi.boolean().default(false),
    prix_nuit_xpf: Joi.number().integer().min(0).required(),
    prix_semaine_xpf: Joi.number().integer().min(0).optional(),
    disponible_du: Joi.date().iso().optional(),
    disponible_au: Joi.date().iso().optional(),
    equipements: Joi.array().items(Joi.string().valid(...LOCATION_EQUIPMENT_VALUES)).default([]),
    animaux_acceptes: Joi.boolean().default(false),
    fumeurs_acceptes: Joi.boolean().default(false),
    localisation_precise: Joi.string().max(255).allow('', null).default(''),
  }).custom((value, helpers) => {
    if (value.prix_semaine_xpf == null && Number.isFinite(Number(value.prix_nuit_xpf))) {
      return value;
    }
    if (value.prix_semaine_xpf != null && Number(value.prix_semaine_xpf) < 0) {
      return helpers.error('any.custom', { message: 'Le prix hebdomadaire doit être positif.' });
    }
    return value;
  });
}

function buildServicesSchema() {
  return Joi.object({
    type_service: Joi.string().valid(...SERVICE_TYPES).required(),
    type_service_autre: Joi.string().max(120).allow('', null).default(''),
    tarif_type: Joi.string().valid(...SERVICE_TARIFF_TYPES).required(),
    tarif_xpf: Joi.number().integer().min(0).optional(),
    tarif_description: Joi.string().max(255).allow('', null).default(''),
    zone_intervention: Joi.alternatives().try(
      Joi.array().items(Joi.string().min(1).max(120)).min(1),
      Joi.string().min(1).max(255),
    ).required(),
    disponibilite: Joi.string().valid(...SERVICE_AVAILABILITY).default('les_deux'),
    experience_annees: Joi.number().integer().min(0).max(80).optional(),
    diplome_certifie: Joi.boolean().default(false),
  }).custom((value, helpers) => {
    if (value.tarif_type !== 'a_negocier' && value.tarif_xpf == null) {
      return helpers.error('any.custom', { message: 'Le tarif est requis pour un prix horaire ou forfaitaire.' });
    }
    if (value.type_service === 'autre' && !String(value.type_service_autre || '').trim()) {
      return helpers.error('any.custom', { message: 'Merci de préciser le type de service.' });
    }
    if (typeof value.zone_intervention === 'string') {
      const zones = value.zone_intervention
        .split(',')
        .map((zone) => zone.trim())
        .filter(Boolean);
      if (zones.length === 0) {
        return helpers.error('any.custom', { message: 'Merci de préciser au moins une zone d’intervention.' });
      }
      value.zone_intervention = zones;
    }
    return value;
  });
}

function buildDonSchema() {
  return Joi.object({
    etat: Joi.string().valid('bon', 'usage', 'a_reparer').required(),
    raison_don: Joi.string().valid('demenagement', 'surplus', 'upgrade', 'autre').default('autre'),
    remise_en_main_propre: Joi.boolean().default(true),
    commune_remise: Joi.string().max(120).required(),
  });
}

function buildImmobilierSchema() {
  return Joi.object({
    transaction: Joi.string().valid(...IMMOBILIER_TRANSACTION_TYPES).required(),
    type_bien: Joi.string().valid(...IMMOBILIER_TYPES).required(),
    surface_m2: Joi.number().integer().min(1).max(5000).required(),
    nb_pieces: Joi.number().integer().min(1).max(20).required(),
    nb_chambres: Joi.number().integer().min(0).max(20).default(0),
    nb_sdb: Joi.number().integer().min(0).max(20).default(0),
    etage: Joi.number().integer().min(-2).max(200).optional(),
    nb_etages_total: Joi.number().integer().min(1).max(200).optional(),
    meuble: Joi.boolean().default(false),
    parking: Joi.boolean().default(false),
    nb_places_parking: Joi.number().integer().min(0).max(50).optional(),
    annee_construction: Joi.number().integer().min(1800).max(new Date().getFullYear() + 1).optional(),
    etat_bien: Joi.string().valid(...IMMOBILIER_CONDITIONS).default('bon'),
    dpe: Joi.string().valid(...IMMOBILIER_DPE).default('NC'),
    charges_mensuelles_xpf: Joi.number().integer().min(0).optional(),
    depot_garantie_xpf: Joi.number().integer().min(0).optional(),
    disponible_le: Joi.date().iso().optional(),
    equipements: Joi.array().items(Joi.string().min(1).max(50)).default([]),
    exposition: Joi.string().valid(...IMMOBILIER_EXPOSURES).optional(),
  });
}

const CATEGORY_SCHEMAS = {
  location_courte_duree: buildLocationSchema(),
  locations: buildLocationSchema(),
  services: buildServicesSchema(),
  don: buildDonSchema(),
  dons: buildDonSchema(),
  vente: buildImmobilierSchema(),
  'location-longue-duree': buildImmobilierSchema(),
  immobilier: Joi.object().unknown(true).default({}),
};

function getMetadataSchema(categorySlug) {
  return CATEGORY_SCHEMAS[normalizeCategorySlug(categorySlug)] ?? Joi.object().unknown(true).default({});
}

function validateListingMetadata(categorySlug, metadata) {
  const schema = getMetadataSchema(categorySlug);
  const { error, value } = schema.validate(metadata ?? {}, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details?.[0];
    const message = details?.message || 'Métadonnées invalides.';
    const validationError = new Error(message);
    validationError.statusCode = 400;
    validationError.code = 'INVALID_LISTING_METADATA';
    validationError.details = error.details || [];
    throw validationError;
  }

  return value || {};
}

function isDonCategory(categorySlug) {
  const slug = normalizeCategorySlug(categorySlug);
  return slug === 'don';
}

function isLocationCategory(categorySlug) {
  return normalizeCategorySlug(categorySlug) === 'location_courte_duree';
}

function isServicesCategory(categorySlug) {
  return normalizeCategorySlug(categorySlug) === 'services';
}

function isImmobilierCategory(categorySlug) {
  return normalizeCategorySlug(categorySlug) === 'immobilier';
}

module.exports = {
  getMetadataSchema,
  isDonCategory,
  isImmobilierCategory,
  isLocationCategory,
  isServicesCategory,
  validateListingMetadata,
};
