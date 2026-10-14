'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const migrationPath = path.resolve(__dirname, '../../../database/migrations/20261015_listing_categories.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');

test('la migration enrichit les catégories sans recréer les catégories existantes', () => {
  assert.match(migration, /ON CONFLICT \(slug\) DO UPDATE/);
  assert.match(migration, /'Maison & Jardin'/);
  assert.match(migration, /'Bricolage & Outillage'/);
  assert.match(migration, /'Mode & Accessoires'/);
  assert.match(migration, /'Famille & Puériculture'/);
  assert.match(migration, /'Animaux'/);
});

test('la migration répare le libellé de location longue durée', () => {
  assert.match(migration, /SET name = 'Location longue durée'/);
  assert.doesNotMatch(migration, /durÃ/);
});
