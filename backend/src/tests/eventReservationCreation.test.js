'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { load } = require('./paymentTransactionHarness');

function harness({ priceXpf = 0, bookingUrl = null } = {}) {
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
            is_free: priceXpf <= 0,
            booking_url: bookingUrl,
          }] };
        }
        if (normalized.includes('FROM ticket_types')) {
          return { rows: [{
            id: 60,
            event_id: 42,
            name: 'Standard',
            description: null,
            price_xpf: priceXpf,
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
                payment_method: params[6],
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
  const serviceSource = fs.readFileSync(
    path.join(__dirname, '..', 'services', 'eventTicketingService.js'),
    'utf8',
  );
  assert.match(serviceSource, /ticket\.order_status === 'reserved' && ticket\.payment_method === 'onsite'/);
  assert.match(serviceSource, /o\.status = 'reserved'[\s\S]*t\.status IN \('reserved', 'active'\)/);

  const migration = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'database', 'migrations', '20261105_ticketing_timestamps.sql'),
    'utf8',
  );
  assert.match(migration, /ALTER TABLE ticket_types[\s\S]*ADD COLUMN IF NOT EXISTS updated_at/);
  assert.match(migration, /ALTER TABLE ticket_orders[\s\S]*ADD COLUMN IF NOT EXISTS updated_at/);

  const paymentMethodMigration = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'database', 'migrations', '20261113_event_ticket_payment_method.sql'),
    'utf8',
  );
  assert.match(paymentMethodMigration, /ADD COLUMN IF NOT EXISTS payment_method/);
  assert.match(paymentMethodMigration, /'free', 'onsite', 'stripe'/);

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

  const onsite = harness({ priceXpf: 2500 });
  const onsiteResult = await onsite.service.reserveEventTickets({
    eventId: 42,
    buyer: { userId: 8, email: 'buyer@example.invalid', name: 'Acheteur Test', phone: null },
    provider: 'onsite',
    items: [{ ticket_type_id: 60, quantity: 2 }],
  });
  assert.strictEqual(onsiteResult.order.status, 'reserved');
  assert.strictEqual(onsiteResult.order.payment_method, 'onsite');
  assert.strictEqual(onsiteResult.payment_method, 'onsite');
  assert.strictEqual(onsiteResult.tickets.length, 2);
  assert.ok(onsiteResult.tickets.every((ticket) => ticket.status === 'active'));
  assert.ok(onsite.calls.some(({ sql, params }) => sql.startsWith('INSERT INTO ticket_orders') && sql.includes('payment_method') && params[6] === 'onsite'));

  const external = harness({ priceXpf: 2500, bookingUrl: 'https://tickets.example.invalid/event' });
  await assert.rejects(
    external.service.reserveEventTickets({
      eventId: 42,
      buyer: { userId: 8, email: 'buyer@example.invalid', name: 'Acheteur Test', phone: null },
      provider: 'onsite',
      items: [{ ticket_type_id: 60, quantity: 1 }],
    }),
    (error) => error.status === 409 && /site de l’organisateur/.test(error.message),
  );

  console.log('Event reservation creation: free, onsite and external booking contracts passed.');
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
