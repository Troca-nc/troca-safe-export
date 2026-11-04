'use strict';

const assert = require('assert');
const { load } = require('./paymentTransactionHarness');

function buildService(eventRow) {
  const calls = [];
  const service = load('services/eventTicketingService.js', {
    '../config/database': {
      async query() { throw new Error('Unexpected non-transactional query'); },
      async withTransaction(work) {
        return work({
          async query(sql, params) {
            const normalized = sql.replace(/\s+/g, ' ').trim();
            calls.push({ sql: normalized, params: Array.from(params) });
            if (normalized.startsWith('SELECT e.id')) return { rows: eventRow ? [eventRow] : [] };
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

async function expectStatus(promise, status) {
  await assert.rejects(promise, (error) => error?.status === status);
}

async function run() {
  {
    const { service, calls } = buildService({ id: 42, organizer_id: 7, bon_plan_id: 9, has_active_orders: false });
    const result = await service.deleteEventByOrganizer({ eventId: 42, organizerId: 7 });
    assert.strictEqual(result.id, 42);
    assert.match(calls[0].sql, /e\.deleted_at IS NULL/);
    assert.ok(calls.some(({ sql }) => /UPDATE events SET status = 'cancelled', deleted_at = NOW\(\)/.test(sql)));
    assert.ok(calls.some(({ sql }) => /UPDATE ticket_types SET is_active = FALSE/.test(sql)));
    assert.ok(calls.some(({ sql, params }) => /UPDATE bon_plans/.test(sql) && params[0] === 9));
  }
  {
    const { service } = buildService({ id: 42, organizer_id: 8, bon_plan_id: 9, has_active_orders: false });
    await expectStatus(service.deleteEventByOrganizer({ eventId: 42, organizerId: 7 }), 403);
  }
  {
    const { service } = buildService({ id: 42, organizer_id: 7, bon_plan_id: 9, has_active_orders: true });
    await expectStatus(service.deleteEventByOrganizer({ eventId: 42, organizerId: 7 }), 409);
  }
  {
    const { service } = buildService(null);
    await expectStatus(service.deleteEventByOrganizer({ eventId: 42, organizerId: 7 }), 404);
  }

  console.log('Event owner deletion: ownership, history protection and soft deletion passed.');
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
