'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const migrationPath = path.resolve(__dirname, '../../../database/migrations/20261018_listing_subcategories.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');

const tuples = [...migration.matchAll(/^\s*\('([^']+)', '([^']+)', '([^']+)', '[^']+', \d+\),?$/gm)]
  .map((match) => ({ parentSlug: match[1], name: match[2], slug: match[3] }));

test('la migration ajoute un catalogue étendu de sous-catégories', () => {
  assert.ok(tuples.length >= 90, `catalogue trop court: ${tuples.length}`);
  assert.ok(tuples.some((item) => item.parentSlug === 'vehicules' && item.name === 'Voitures'));
  assert.ok(tuples.some((item) => item.parentSlug === 'multimedia' && item.name === 'Informatique'));
  assert.ok(tuples.some((item) => item.parentSlug === 'sports-loisirs' && item.name === 'Sports & Plein air'));
  assert.ok(tuples.some((item) => item.parentSlug === 'don' && item.name === 'Autres dons'));
});

test('les sous-catégories ont des slugs uniques et restent rattachées à leur famille', () => {
  const slugs = tuples.map((item) => item.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.match(migration, /JOIN categories parent ON parent\.slug = desired\.parent_slug/);
  assert.match(migration, /ON CONFLICT \(slug\) DO UPDATE SET/);
  assert.match(migration, /parent_id = EXCLUDED\.parent_id/);
});
