'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const {
  activeListingLimit,
  listingPhotoLimit,
  assertActiveListingCapacity,
  assertActiveCatalogCapacity,
} = require('../services/commercialQuotaService');

function countingClient(count, calls = []) {
  return {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('FROM users')) return { rows: [{ id: values[0] }] };
      return { rows: [{ count }] };
    },
  };
}

describe('Commercial quotas', () => {
  it('applique cinq annonces et six photos au compte gratuit', () => {
    assert.strictEqual(activeListingLimit({ is_pro: false }), 5);
    assert.strictEqual(listingPhotoLimit({ is_pro: false }), 6);
  });

  it('applique cent annonces et douze photos au droit Pro courant', () => {
    assert.strictEqual(activeListingLimit({ is_pro: true }), 100);
    assert.strictEqual(listingPhotoLimit({ is_pro: true }), 12);
  });

  it('sérialise le comptage puis autorise la dernière place disponible', async () => {
    const calls = [];
    await assertActiveListingCapacity(countingClient(4, calls), { id: 7, is_pro: false });
    assert.ok(calls[0].sql.includes('FOR UPDATE'));
    assert.ok(calls[1].sql.includes("status = 'active'"));
  });

  it('refuse une annonce au plafond avec une erreur métier explicite', async () => {
    await assert.rejects(
      assertActiveListingCapacity(countingClient(5), { id: 7, is_pro: false }),
      (error) => error.status === 403 && error.code === 'ACTIVE_LISTING_LIMIT_REACHED',
    );
  });

  it('refuse la cent-unième fiche catalogue active', async () => {
    await assert.rejects(
      assertActiveCatalogCapacity(countingClient(100), { id: 9, is_pro: true }),
      (error) => error.status === 403 && error.code === 'ACTIVE_CATALOG_LIMIT_REACHED',
    );
  });

  it('branche les trois créations et la limite photo sur la frontière commune', () => {
    const routes = ['annonces.js', 'pro.products.js', 'upload.js']
      .map((name) => fs.readFileSync(path.join(__dirname, '..', 'routes', name), 'utf8'));
    assert.ok(routes[0].includes('assertActiveListingCapacity(client, req.user)'));
    assert.ok(routes[1].includes('assertActiveCatalogCapacity(client, req.user)'));
    assert.ok(routes[1].includes('assertActiveListingCapacity(client, req.user)'));
    assert.ok(routes[2].includes('listingPhotoLimit(req.user)'));
    assert.ok(routes[0].includes("value.status === 'active'"));
    assert.ok(routes[0].includes("nextStatus === 'active'"));
    assert.ok(routes[2].includes('FOR UPDATE'));
  });
});
