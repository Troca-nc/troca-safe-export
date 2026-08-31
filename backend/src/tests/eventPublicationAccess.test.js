'use strict';

// Public access regression: only published events may be returned.
// Historical cancelled/completed rows lack verified publication history.
// No application imports outside the allowlisted VM, DB, network or providers.
const assert = require('assert');
const { load } = require('./paymentTransactionHarness');

function harness({ status = 'published', missing = false, queryError = false } = {}) {
  const calls = [];
  const row = {
    id: 42, organizer_id: 7, title: 'Synthetic event', status,
    description: 'Synthetic draft content',
    organizer_email: 'organizer@example.invalid',
    organizer_phone: 'synthetic-phone', photos: [],
  };
  const forbidden = () => { throw new Error('Unexpected side effect'); };
  const service = load('services/eventTicketingService.js', {
    '../config/database': {
      async query(sql, params) {
        const normalized = sql.replace(/\s+/g, ' ').trim();
        calls.push({ sql: normalized, params: Array.from(params) });
        if (queryError) throw new Error('Synthetic database error');
        if (normalized.startsWith('SELECT e.*, c.name AS commune_name FROM events e')) {
          // Assert the production predicate before simulating its selection.
          // Removing the filter must fail, not be concealed by mock behavior.
          assert.match(normalized, /WHERE e\.id = \$1 AND e\.status = 'published' LIMIT 1$/);
          assert.strictEqual(params.length, 1);
          assert.strictEqual(params[0], 42);
          return { rows: missing || status !== 'published' ? [] : [row] };
        }
        if (normalized.includes('FROM ticket_types')) {
          assert.match(normalized, /WHERE event_id = \$1 ORDER BY position ASC, id ASC$/);
          assert.strictEqual(params[0], 42);
          return { rows: [] };
        }
        throw new Error(`Unexpected SQL: ${normalized}`);
      },
      withTransaction: forbidden,
    },
    '../config/env': { isConfiguredValue: forbidden },
    './qrCodeService': { generateTicketToken: forbidden },
  });
  return { service, calls };
}

async function run() {
  let count = 0;
  async function check(label, fn) {
    await fn();
    count++;
    console.log(`  OK ${label}`);
  }

  await check('missing event returns null without loading ticket types', async () => {
    const h = harness({ missing: true });
    assert.strictEqual(await h.service.getPublicEventById(42), null);
    assert.strictEqual(h.calls.length, 1);
  });

  await check('published event remains public', async () => {
      const h = harness();
      const event = await h.service.getPublicEventById(42);
      assert.strictEqual(event.id, 42);
      assert.strictEqual(event.status, 'published');
      assert.strictEqual(event.ticket_types.length, 0);
      assert.strictEqual(h.calls.length, 2);
  });

  for (const status of ['draft', 'cancelled', 'completed', null, 'unknown']) {
    await check(`public read hides ${status} without loading ticket types`, async () => {
      const h = harness({ status });
      const event = await h.service.getPublicEventById(42);
      assert.strictEqual(event, null);
      assert.strictEqual(h.calls.length, 1);
    });
  }

  await check('database error rejects instead of returning partial event', async () => {
    const h = harness({ queryError: true });
    await assert.rejects(h.service.getPublicEventById(42), /Synthetic database error/);
    assert.strictEqual(h.calls.length, 1);
  });

  for (const status of ['draft', 'cancelled', 'completed']) {
    await check(`reservation rejects ${status} before transaction or provider`, async () => {
      const h = harness({ status });
      await assert.rejects(
        h.service.reserveEventTickets({
          eventId: 42, buyer: { email: 'buyer@example.invalid' },
          items: [{ ticket_type_id: 1, quantity: 1 }],
        }),
        (error) => error.status === 404,
      );
      assert.strictEqual(h.calls.length, 1);
      assert.ok(h.calls.every(({ sql }) => sql.startsWith('SELECT ')));
    });
  }

  await check('reservation of missing event rejects with 404', async () => {
    const h = harness({ missing: true });
    await assert.rejects(
      h.service.reserveEventTickets({ eventId: 42, buyer: {}, items: [] }),
      (error) => error.status === 404,
    );
    assert.strictEqual(h.calls.length, 1);
  });
  console.log(`Event publication access: ${count} checks passed.`);
}

const completion = run();
if (require.main === module) {
  completion.catch((error) => { console.error(error); process.exitCode = 1; });
}
module.exports = completion;
