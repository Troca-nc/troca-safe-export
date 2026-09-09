'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const { TRANSITIONS, transitionProBooking } = require('../services/proBookingStateService');

describe('Pro booking state machine', () => {
  it('définit des transitions strictes', () => {
    assert.deepStrictEqual(TRANSITIONS.confirmed.from, ['pending']);
    assert.deepStrictEqual(TRANSITIONS.declined.from, ['pending']);
    assert.deepStrictEqual(TRANSITIONS.cancelled.from, ['pending', 'confirmed']);
    assert.deepStrictEqual(TRANSITIONS.completed.from, ['confirmed']);
  });

  it('conditionne atomiquement la mutation à l état courant', async () => {
    const calls = [];
    const client = {
      async query(sql, params) {
        calls.push({ sql, params });
        return { rows: [{ id: 7, status: 'confirmed' }] };
      },
    };

    const updated = await transitionProBooking(client, 7, 'confirmed');

    assert.strictEqual(updated.status, 'confirmed');
    assert.ok(calls[0].sql.includes('status = ANY($3::text[])'));
    assert.deepStrictEqual(calls[0].params, [7, 'confirmed', ['pending']]);
  });

  it('refuse une course perdue avec un conflit', async () => {
    const client = { query: async () => ({ rows: [] }) };
    await assert.rejects(
      () => transitionProBooking(client, 7, 'completed'),
      (error) => error.statusCode === 409
    );
  });

  it('utilise le service commun et garde la libération du créneau transactionnelle', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'pro.bookings.js'), 'utf8');
    assert.strictEqual((source.match(/transitionProBooking\(client, bookingId/g) || []).length, 4);
    assert.ok(source.includes('if (bookingUpdate.slot_id)'));
  });
});
