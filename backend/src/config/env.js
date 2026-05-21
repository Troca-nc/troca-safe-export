'use strict';

const PLACEHOLDER_MARKERS = [
  'changeme',
  'dev_secret_change_in_prod',
  'replace_me',
  'placeholder',
  'coller_la_cle_ici',
  'todo',
  'example',
];

function normalize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isConfiguredValue(value) {
  const normalized = normalize(value);
  if (!normalized) return false;

  const lowered = normalized.toLowerCase();
  return !PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker));
}

function requireConfiguredEnv(name, { fallback = '', minLength = 0 } = {}) {
  const value = normalize(process.env[name]);

  if (isConfiguredValue(value)) {
    if (process.env.NODE_ENV === 'production' && minLength > 0 && value.length < minLength) {
      throw new Error(`${name} trop court ou invalide en production`);
    }
    return value;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} manquant ou invalide en production`);
  }

  return fallback;
}

module.exports = {
  isConfiguredValue,
  requireConfiguredEnv,
};
