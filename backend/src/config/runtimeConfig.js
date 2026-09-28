'use strict';

const { isConfiguredValue } = require('./env');

const REQUIRED_PRODUCTION = [
  'BASE_URL',
  'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
  'REDIS_URL', 'REDIS_REQUIRED',
  'JWT_SECRET', 'JWT_ACCESS_EXPIRES', 'JWT_REFRESH_EXPIRES',
  'INTERNAL_API_TOKEN', 'BUSINESS_TIME_ZONE', 'STORAGE_LOCAL_PATH',
  'AWS_BUCKET', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY',
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM',
  'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SID',
  'TURNSTILE_SECRET_KEY',
  'ADMIN_EMAIL', 'ADMIN_API_TOKEN', 'ADMIN_ALERT_EMAIL',
];

const OPTIONAL_INTEGRATIONS = {
  STRIPE: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_PRO_MENSUEL', 'STRIPE_PRICE_PRO_ANNUEL'],
  PAYPLUG: ['PAYPLUG_SECRET_KEY', 'PAYPLUG_WEBHOOK_SECRET'],
  GOOGLE: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  APPLE: ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'],
};

const MIN_LENGTHS = {
  JWT_SECRET: 64,
  INTERNAL_API_TOKEN: 32,
  ADMIN_API_TOKEN: 32,
  DB_PASSWORD: 16,
  REDIS_URL: 16,
};

function validateRuntimeConfig({ env = process.env, role = 'api' } = {}) {
  if (env.NODE_ENV !== 'production') return { role, validated: false };

  const errors = [];
  for (const name of REQUIRED_PRODUCTION) {
    const value = String(env[name] || '').trim();
    if (!isConfiguredValue(value)) {
      errors.push(`${name} missing or placeholder`);
      continue;
    }
    if (MIN_LENGTHS[name] && value.length < MIN_LENGTHS[name]) {
      errors.push(`${name} shorter than ${MIN_LENGTHS[name]} characters`);
    }
  }

  for (const [provider, names] of Object.entries(OPTIONAL_INTEGRATIONS)) {
    const configured = names.filter((name) => isConfiguredValue(String(env[name] || '').trim()));
    if (configured.length > 0 && configured.length < names.length) {
      for (const name of names) {
        if (!isConfiguredValue(String(env[name] || '').trim())) {
          errors.push(`${name} missing for enabled ${provider} integration`);
        }
      }
    }
  }

  if (env.REDIS_REQUIRED !== 'true') errors.push('REDIS_REQUIRED must be true');
  try {
    const baseUrl = new URL(env.BASE_URL);
    if (baseUrl.protocol !== 'https:') errors.push('BASE_URL must use HTTPS');
  } catch {
    errors.push('BASE_URL must be a valid URL');
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: env.BUSINESS_TIME_ZONE }).format();
  } catch {
    errors.push('BUSINESS_TIME_ZONE must be a valid IANA timezone');
  }

  if (errors.length) {
    const error = new Error(`Invalid ${role} production configuration: ${errors.join(', ')}`);
    error.code = 'INVALID_PRODUCTION_CONFIG';
    error.fields = errors.map((item) => item.split(' ')[0]);
    throw error;
  }
  return { role, validated: true };
}

module.exports = { OPTIONAL_INTEGRATIONS, REQUIRED_PRODUCTION, validateRuntimeConfig };
