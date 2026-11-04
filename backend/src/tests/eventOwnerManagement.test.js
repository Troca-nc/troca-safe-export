'use strict';

const assert = require('assert');
const { load } = require('./paymentTransactionHarness');

function buildService(transactionRow, managedRow = null, ticketRows = []) {
  const calls = [];
  const service = load('services/eventTicketingService.js', {
    '../config/database': {
      async query(sql, params) {
        const normalized = sql.replace(/\s+/g, ' ').trim();
        calls.push({ scope: 'global', sql: normalized, params: Array.from(params) });
        if (normalized.includes('LEFT JOIN bon_plans b')) return { rows: managedRow ? [managedRow] : [] };
        if (normalized.includes('FROM ticket_types')) return { rows: ticketRows };
        throw new Error(`Unexpected global query: ${normalized}`);
      },
      async withTransaction(work) {
        return work({
          async query(sql, params) {
            const normalized = sql.replace(/\s+/g, ' ').trim();
            calls.push({ scope: 'transaction', sql: normalized, params: Array.from(params) });
            if (normalized.startsWith('SELECT e.id')) return { rows: transactionRow ? [transactionRow] : [] };
            if (normalized.startsWith('INSERT INTO ticket_types')) {
              return { rows: [{ id: 81, event_id: params[0], name: params[1], price_xpf: params[3], quantity_total: params[4] }] };
            }
            return { rows: [], rowCount: 1 };
          },
        });
      },
    },
    '../config/env': { isConfiguredValue() { return false; } },
    './qrCodeService': { generateTicketToken() { throw new Error('Unexpected token generation'); } },
  });
  return { service, calls };
}

const payload = {
  title: 'Événement modifié',
  description: 'Nouvelle description',
  venue_name: 'Maison de quartier',
  venue_address: '1 rue des Tests',
  commune_id: 3,
  event_date: '2026-12-20',
  event_time: '18:00',
  end_time: '20:00',
  cover_image_url: null,
  photos: [],
  category: 'conference',
  has_ticketing: true,
  max_capacity: 40,
  is_free: true,
  organizer_name: 'Association Test',
  organizer_email: 'events@example.invalid',
  organizer_phone: null,
  website_url: 'https://example.invalid/event',
  target_audience: 'particulier',
  kind: 'event',
  price_xpf: 0,
  ticket_types: [{ name: 'Standard', description: '', price_xpf: 0, quantity_total: 40, position: 0 }],
};

async function expectStatus(promise, status) {
  await assert.rejects(promise, (error) => error?.status === status);
}

async function run() {
  {
    const managed = { id: 42, organizer_id: 7, title: 'Mon événement', status: 'published', ticketing_locked: true };
    const { service, calls } = buildService(null, managed, [{ id: 12, event_id: 42, name: 'Standard', price_xpf: 0, quantity_total: 20 }]);
    const event = await service.getEventByOrganizer({ eventId: 42, organizerId: 7 });
    assert.strictEqual(event.id, 42);
    assert.strictEqual(event.ticketing_locked, true);
    assert.strictEqual(event.ticket_types.length, 1);
    assert.deepStrictEqual(calls[0].params, [42, 7]);
  }
  {
    const row = { id: 42, organizer_id: 7, bon_plan_id: 9, status: 'published', has_ticketing: true, max_capacity: 20, is_free: true, ticketing_locked: true };
    const managed = { ...row, title: payload.title };
    const { service, calls } = buildService(row, managed);
    const event = await service.updateEventByOrganizer({ eventId: 42, organizerId: 7, payload });
    assert.strictEqual(event.id, 42);
    assert.ok(calls.some(({ sql }) => sql.startsWith('UPDATE events')));
    assert.ok(calls.some(({ sql }) => sql.startsWith('UPDATE bon_plans')));
    assert.ok(!calls.some(({ sql }) => sql.startsWith('DELETE FROM ticket_types')));
    assert.ok(!calls.some(({ sql }) => sql.startsWith('INSERT INTO ticket_types')));
  }
  {
    const row = { id: 42, organizer_id: 7, bon_plan_id: 9, status: 'draft', has_ticketing: false, max_capacity: null, is_free: true, ticketing_locked: false };
    const managed = { ...row, title: payload.title };
    const { service, calls } = buildService(row, managed);
    await service.updateEventByOrganizer({ eventId: 42, organizerId: 7, payload });
    assert.ok(calls.some(({ sql }) => sql.startsWith('DELETE FROM ticket_types')));
    assert.ok(calls.some(({ sql }) => sql.startsWith('INSERT INTO ticket_types')));
  }
  {
    const row = { id: 42, organizer_id: 8, bon_plan_id: 9, status: 'published', ticketing_locked: false };
    const { service } = buildService(row);
    await expectStatus(service.updateEventByOrganizer({ eventId: 42, organizerId: 7, payload }), 403);
  }
  {
    const row = { id: 42, organizer_id: 7, bon_plan_id: 9, status: 'published', has_paid_orders: true };
    const { service } = buildService(row);
    await expectStatus(service.cancelEventByOrganizer({ eventId: 42, organizerId: 7 }), 409);
  }
  {
    const row = { id: 42, organizer_id: 7, bon_plan_id: 9, status: 'published', has_paid_orders: false };
    const managed = { ...row, status: 'cancelled' };
    const { service, calls } = buildService(row, managed);
    const event = await service.cancelEventByOrganizer({ eventId: 42, organizerId: 7 });
    assert.strictEqual(event.status, 'cancelled');
    assert.ok(calls.some(({ sql }) => sql.startsWith('UPDATE ticket_orders')));
    assert.ok(calls.some(({ sql }) => sql.includes("UPDATE events SET status = 'cancelled'")));
    assert.ok(calls.some(({ sql }) => sql.startsWith('UPDATE bon_plans')));
  }

  console.log('Event owner management: read, edit, ticket lock and cancellation passed.');
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
