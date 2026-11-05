'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { load } = require('./paymentTransactionHarness');

function harness() {
  const calls = [];
  const service = load('services/eventTicketingService.js', {
    '../config/database': {
      async query(sql, params) {
        const normalized = sql.replace(/\s+/g, ' ').trim();
        calls.push({ scope: 'global', sql: normalized, params: Array.from(params) });
        if (normalized.startsWith('SELECT e.*, c.name AS commune_name FROM events e')) {
          return { rows: [{
            id: 42,
            organizer_id: 7,
            title: 'Événement gratuit',
            status: 'published',
            photos: [],
            has_ticketing: true,
            is_free: true,
          }] };
        }
        if (normalized.includes('FROM ticket_types')) {
          return { rows: [{
            id: 60,
            event_id: 42,
            name: 'Standard',
            description: null,
            price_xpf: 0,
            quantity_total: 20,
            quantity_sold: 0,
            quantity_reserved: 0,
            is_active: true,
            position: 0,
          }] };
        }
        throw new Error(`Unexpected global SQL: ${normalized}`);
      },
      async withTransaction(work) {
        return work({
          async query(sql, params) {
            const normalized = sql.replace(/\s+/g, ' ').trim();
            calls.push({ scope: 'transaction', sql: normalized, params: Array.from(params) });
            if (normalized.startsWith('INSERT INTO ticket_orders')) {
              return { rows: [{
                id: 81,
                event_id: 42,
                buyer_id: params[1],
                buyer_email: params[2],
                buyer_name: params[3],
                status: 'reserved',
                total_xpf: params[5],
              }] };
            }
            if (normalized.startsWith('INSERT INTO tickets')) {
              return { rows: [{
                id: 91,
                order_id: 81,
                event_id: 42,
                ticket_type_id: 60,
                buyer_email: params[4],
                price_xpf: 0,
                token: params[6],
                status: 'reserved',
              }] };
            }
            return { rows: [], rowCount: 1 };
          },
        });
      },
    },
    '../config/env': { isConfiguredValue() { return false; } },
    './qrCodeService': { generateTicketToken() { return 'ticket-token'; } },
  });
  return { service, calls };
}

async function run() {
  const migration = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'database', 'migrations', '20261105_ticketing_timestamps.sql'),
    'utf8',
  );
  assert.match(migration, /ALTER TABLE ticket_types[\s\S]*ADD COLUMN IF NOT EXISTS updated_at/);
  assert.match(migration, /ALTER TABLE ticket_orders[\s\S]*ADD COLUMN IF NOT EXISTS updated_at/);

  const { service, calls } = harness();
  const result = await service.reserveEventTickets({
    eventId: 42,
    buyer: {
      userId: 7,
      email: 'organizer@example.invalid',
      name: 'Organisateur Test',
      phone: null,
    },
    items: [{ ticket_type_id: 60, quantity: 1 }],
  });

  assert.strictEqual(result.order.buyer_id, 7);
  assert.strictEqual(result.order.status, 'paid');
  assert.strictEqual(result.tickets.length, 1);
  assert.strictEqual(result.tickets[0].status, 'active');
  assert.ok(calls.some(({ sql }) => sql.startsWith('UPDATE ticket_types') && sql.includes('updated_at = NOW()')));
  assert.ok(calls.some(({ sql }) => sql.startsWith('UPDATE ticket_orders') && sql.includes('updated_at = NOW()')));
  console.log('Event reservation creation: same-account free booking and timestamp schema passed.');
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
