'use strict';

// Legacy characterization, not approval of publishing without payment.
// Replace these expectations when the publication-order flow is implemented.
const assert = require('assert');
const { load } = require('./paymentTransactionHarness');

async function run() {
  let count = 0;
  for (const status of [undefined, 'published', 'draft']) {
    for (const isFree of [false, true]) {
      const writes = [];
      let transactions = 0;
      const forbidden = () => { throw new Error('Unexpected external effect'); };
      const service = load('services/eventTicketingService.js', {
        '../config/database': {
          query: forbidden,
          async withTransaction(fn) {
            transactions++;
            return fn({
              async query(sql, params) {
                const normalized = sql.replace(/\s+/g, ' ').trim();
                writes.push({ sql: normalized, params: Array.from(params) });
                if (normalized.startsWith('INSERT INTO bon_plans ')) {
                  assert.match(normalized, /'active', NOW\(\) \+ INTERVAL '365 days'/);
                  assert.strictEqual(params[0], 7);
                  assert.strictEqual(params[8], 0);
                  assert.strictEqual(params[9], isFree);
                  return { rows: [{ id: 41 }] };
                }
                if (normalized.startsWith('INSERT INTO events ')) {
                  assert.strictEqual(params[0], 41);
                  assert.strictEqual(params[1], 7);
                  assert.strictEqual(params[13], status || 'published');
                  assert.strictEqual(params[14], false);
                  return { rows: [{
                    id: 42, bon_plan_id: 41, organizer_id: 7,
                    title: 'Synthetic event', status: params[13], is_free: params[16],
                    has_ticketing: false, photos: [],
                  }] };
                }
                throw new Error(`Unexpected SQL: ${normalized}`);
              },
            });
          },
        },
        '../config/env': { isConfiguredValue: forbidden },
        './qrCodeService': { generateTicketToken: forbidden },
      });
      const event = await service.createEventAndBonPlan({
        user: { id: 7, email: 'organizer@example.invalid' },
        payload: {
          title: 'Synthetic event', category: 'autre', event_date: '2026-10-01',
          event_time: '10:00', status, is_free: isFree, has_ticketing: false,
          price_xpf: 0, ticket_types: [],
        },
      });
      assert.strictEqual(event.status, status || 'published');
      assert.strictEqual(event.is_free, isFree);
      assert.strictEqual(event.ticket_types.length, 0);
      assert.strictEqual(transactions, 1);
      assert.strictEqual(writes.length, 2);
      assert.ok(writes.every(({ sql }) => !/INSERT INTO (payments|ticket_orders|tickets|ticket_types)\b/.test(sql)));
      count++;
      console.log(`  OK LEGACY creation status=${status || 'default'} freeAdmission=${isFree} without publication payment`);
    }
  }
  console.log(`Event creation characterization: ${count} passed; publication payment is NOT implemented.`);
}

const completion = run();
if (require.main === module) {
  completion.catch((error) => { console.error(error); process.exitCode = 1; });
}
module.exports = completion;
