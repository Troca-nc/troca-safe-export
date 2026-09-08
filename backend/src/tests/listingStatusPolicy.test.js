'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const { canChangeListingStatus } = require('../services/listingStatusPolicy');

describe('Listing status policy', () => {
  it('autorise les transitions ordinaires du propriétaire', () => {
    assert.strictEqual(canChangeListingStatus('active', 'reserved'), true);
    assert.strictEqual(canChangeListingStatus('active', 'sold'), true);
    assert.strictEqual(canChangeListingStatus('reserved', 'active'), true);
    assert.strictEqual(canChangeListingStatus('sold', 'active'), true);
  });

  it('interdit au propriétaire de sortir des états de modération', () => {
    for (const state of ['pending', 'expired', 'deleted', 'inactive']) {
      assert.strictEqual(canChangeListingStatus(state, 'active'), false);
    }
  });

  it('permet la restauration explicite par un administrateur', () => {
    assert.strictEqual(canChangeListingStatus('pending', 'active', { isAdmin: true }), true);
  });

  it('retire les écritures de statut du PUT propriétaire générique', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'annonces.js'), 'utf8');
    const putStart = source.indexOf("router.put('/:id'");
    const putEnd = source.indexOf('// ── DELETE /api/listings', putStart);
    const putRoute = source.slice(putStart, putEnd);
    assert.ok(putRoute.includes('value.status !== undefined && !req.user.is_admin'));
    assert.ok(source.includes('canChangeListingStatus(listing.status, nextStatus'));
  });
});
