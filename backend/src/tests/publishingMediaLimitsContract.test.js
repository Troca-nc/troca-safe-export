'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { PHOTO_LIMITS } = require('../services/commercialQuotaService');

const frontendConfig = fs.readFileSync(
  path.resolve(__dirname, '../../../frontend/src/components/listings/publish/publishingConfig.ts'),
  'utf8',
);
const uploadRoute = fs.readFileSync(path.resolve(__dirname, '../routes/upload.js'), 'utf8');

test('les limites affichées dans le parcours de publication correspondent aux quotas serveur', () => {
  assert.deepEqual(PHOTO_LIMITS, { free: 6, pro: 12 });
  assert.match(frontendConfig, /personal:\s*6/);
  assert.match(frontendConfig, /pro:\s*12/);
});

test('la taille maximale annoncée correspond à la valeur serveur par défaut', () => {
  assert.match(frontendConfig, /maxSizeMb:\s*10/);
  assert.match(uploadRoute, /MAX_FILE_SIZE_MB\) \|\| 10/);
});
