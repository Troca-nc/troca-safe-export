'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

describe('Manual ride acceptance capacity', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'covoiturage.route.js'), 'utf8');
  const start = source.indexOf("router.post('/bookings/:bookingId/accept'");
  const end = source.indexOf("router.post('/bookings/:bookingId/decline'", start);
  const route = source.slice(start, end);

  it('verrouille la demande et le trajet avant acceptation', () => {
    assert.ok(route.includes('FOR UPDATE'));
  });

  it('réserve seulement si la capacité courante suffit', () => {
    assert.ok(route.includes("status IN ('published', 'full')"));
    assert.ok(route.includes('GREATEST(COALESCE(seats_remaining, seats_total - COALESCE(seats_reserved, 0)), 0) >= $2'));
    assert.ok(route.includes('seats_reserved = COALESCE(seats_reserved, 0) + $2'));
  });

  it('annule la transaction si la mise à jour de capacité échoue', () => {
    const capacityFailure = route.indexOf('updatedRideRes.rows.length === 0');
    const bookingAcceptance = route.indexOf("SET status = 'accepted'");
    assert.ok(capacityFailure > 0);
    assert.ok(bookingAcceptance > capacityFailure);
    assert.ok(route.includes("statusCode: 409"));
  });
});
