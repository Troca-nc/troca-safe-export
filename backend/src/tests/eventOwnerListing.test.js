'use strict';

const assert = require('assert');
const { load } = require('./paymentTransactionHarness');

async function run() {
  const calls = [];
  const service = load('services/eventTicketingService.js', {
    '../config/database': {
      async query(sql, params) {
        calls.push({ sql: sql.replace(/\s+/g, ' ').trim(), params: Array.from(params) });
        return { rows: [{ id: 42, organizer_id: 7, title: 'Mon événement', status: 'published', tickets_sold: 0 }] };
      },
      withTransaction() { throw new Error('Unexpected transaction'); },
    },
    '../config/env': { isConfiguredValue() { return false; } },
    './qrCodeService': { generateTicketToken() { throw new Error('Unexpected token generation'); } },
  });

  const events = await service.listEventsByOrganizer({ organizerId: 7, limit: 500 });
  assert.strictEqual(calls.length, 1);
  assert.match(calls[0].sql, /WHERE e\.organizer_id = \$1/);
  assert.deepStrictEqual(calls[0].params, [7, 100]);
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].organizer_id, 7);
  assert.strictEqual(events[0].title, 'Mon événement');
  console.log('Event owner listing: authenticated organizer boundary passed.');
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
