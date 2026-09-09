'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const { REQUIRED_PRODUCTION, validateRuntimeConfig } = require('../config/runtimeConfig');

function validProductionEnv() {
  const env = Object.fromEntries(REQUIRED_PRODUCTION.map((name) => [name, `valid-${name.toLowerCase()}-configuration-value`]));
  return {
    ...env,
    NODE_ENV: 'production',
    BASE_URL: 'https://kalico.nc',
    BUSINESS_TIME_ZONE: 'Pacific/Noumea',
    REDIS_REQUIRED: 'true',
    REDIS_URL: 'redis://:strong-password@redis:6379',
    JWT_SECRET: 'j'.repeat(64),
    INTERNAL_API_TOKEN: 'i'.repeat(32),
    ADMIN_API_TOKEN: 'a'.repeat(32),
    DB_PASSWORD: 'd'.repeat(16),
  };
}

describe('runtime production configuration', () => {
  it('accepts a complete production contract', () => {
    assert.deepStrictEqual(validateRuntimeConfig({ env: validProductionEnv(), role: 'worker' }), {
      role: 'worker', validated: true,
    });
  });

  it('rejects every missing, placeholder or unsafe critical value before startup', () => {
    for (const [name, value] of [
      ['STRIPE_WEBHOOK_SECRET', ''],
      ['PAYPLUG_WEBHOOK_SECRET', 'CHANGE_ME'],
      ['TURNSTILE_SECRET_KEY', 'your_turnstile_secret_key'],
      ['JWT_SECRET', 'short'],
      ['REDIS_REQUIRED', 'false'],
      ['BASE_URL', 'http://kalico.nc'],
      ['BUSINESS_TIME_ZONE', 'Noumea/Invalid'],
    ]) {
      const env = { ...validProductionEnv(), [name]: value };
      assert.throws(() => validateRuntimeConfig({ env }), { code: 'INVALID_PRODUCTION_CONFIG' }, name);
    }
  });

  it('runs the same validator before API and worker dependency startup', () => {
    const root = path.resolve(__dirname, '..', '..', '..');
    for (const entrypoint of ['backend/src/index.js', 'backend/src/worker.js']) {
      const source = fs.readFileSync(path.join(root, entrypoint), 'utf8');
      assert.match(source, /validateRuntimeConfig\(\{ role: '(?:api|worker)' \}\)/);
      const startup = source.slice(source.indexOf('async function start()'));
      assert.ok(startup.indexOf('validateRuntimeConfig(') < startup.indexOf('await checkConnection()'));
    }
  });
});
