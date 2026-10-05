'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

function routeSource(name) {
  return fs.readFileSync(path.join(__dirname, '..', 'routes', name), 'utf8');
}

describe('Personal account route contracts', () => {
  it('expose la liste authentifiée avant la route générique de détail', () => {
    const source = routeSource('annonces.js');
    const mine = source.indexOf("router.get('/mine', authenticate");
    const detail = source.indexOf("router.get('/:id', optionalAuth");
    assert.ok(mine >= 0);
    assert.ok(detail > mine);
    assert.ok(source.includes("a.status <> 'deleted'"));
    assert.ok(source.includes('activeListingLimit(req.user)'));
    assert.ok(source.includes('message_count'));
  });

  it('renouvelle uniquement une annonce expirée et réapplique le quota', () => {
    const source = routeSource('annonces.js');
    assert.ok(source.includes("router.post('/:id/renew', authenticate"));
    assert.ok(source.includes("Seule une annonce expirée peut être renouvelée."));
    assert.ok(source.includes("expires_at = NOW() + INTERVAL '60 days'"));
    assert.ok(source.includes('assertActiveListingCapacity(client, req.user, { excludeListingId: listing.id })'));
  });

  it('conserve les favoris vendus sans exposer les annonces supprimées', () => {
    const source = routeSource('users.js');
    const favoriteRoute = source.slice(source.indexOf("router.get('/me/favoris'"), source.indexOf("router.get('/:id/profile'"));
    assert.ok(favoriteRoute.includes("a.status <> 'deleted'"));
    assert.ok(!favoriteRoute.includes("a.status = 'active'"));
    assert.ok(favoriteRoute.includes('a.status, a.expires_at'));
  });

  it('agrège seulement les offres reçues par le vendeur connecté', () => {
    const source = routeSource('offers.route.js');
    assert.ok(source.includes("router.get('/offers/received'"));
    assert.ok(source.includes('WHERE c.seller_id = $1'));
    assert.ok(source.includes('AND m.sender_id = o.buyer_id'));
    assert.ok(source.includes('[req.user.id]'));
    assert.ok(source.includes("router.post('/offers/:id/respond'"));
    assert.ok(source.includes("router.post('/offers'"));
  });
});
