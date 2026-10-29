'use strict';

const assert = require('assert');
const { load } = require('./paymentTransactionHarness');

function harness() {
  const calls = [];
  const transactionCalls = [];
  const conversation = {
    id: 42,
    buyer_id: 7,
    seller_id: 8,
    conversation_type: 'listing_chat',
    metadata: {},
  };
  const service = load('services/messageConversationService.js', {
    path: {},
    fs: { promises: {} },
    './messagePresentation': {
      filterMessage: () => ({ blocked: false }),
      decodeStructuredMessage: () => null,
      maskPhoneNumbers: (value) => value,
      mapConversationRow: (value) => value,
      mapMessageRow: (value) => value,
    },
    './sellerInsightsService': { getSellerResponseTime: async () => null },
    '../config/database': {
      async query(sql, params) {
        const normalized = sql.replace(/\s+/g, ' ').trim();
        calls.push({ sql: normalized, params: Array.from(params) });
        if (normalized.startsWith('SELECT')) return { rows: [conversation] };
        return { rows: [] };
      },
      async withTransaction(callback) {
        return callback({
          async query(sql, params) {
            const normalized = sql.replace(/\s+/g, ' ').trim();
            transactionCalls.push({ sql: normalized, params: Array.from(params) });
            if (normalized.startsWith('INSERT INTO messages')) {
              return { rows: [{ id: 12, sender_id: 7, type: 'text', content: 'Bonjour' }] };
            }
            return { rows: [] };
          },
        });
      },
    },
  });
  return { calls, service, transactionCalls };
}

async function run() {
  let count = 0;
  async function check(label, fn) { await fn(); count++; console.log(`  OK ${label}`); }

  await check('message append aliases conversations for the shared access clause', async () => {
    const h = harness();
    const result = await h.service.appendConversationMessage(7, 42, { type: 'text', content: 'Bonjour' });
    assert.match(h.calls[0].sql, /FROM conversations c WHERE id = \$1 AND/);
    assert.match(h.calls[0].sql, /c\.buyer_id = \$2 OR c\.seller_id = \$2/);
    assert.deepStrictEqual(h.calls[0].params, [42, 7]);
    assert.strictEqual(h.transactionCalls.length, 2);
    assert.strictEqual(result.conversationId, 42);
  });

  await check('conversation archive aliases conversations for the shared access clause', async () => {
    const h = harness();
    assert.strictEqual(await h.service.archiveConversation(7, 42), true);
    assert.match(h.calls[0].sql, /FROM conversations c WHERE id = \$1 AND/);
    assert.match(h.calls[0].sql, /c\.buyer_id = \$2 OR c\.seller_id = \$2/);
    assert.match(h.calls[1].sql, /UPDATE conversations SET is_archived_buyer = TRUE WHERE id = \$1/);
  });

  console.log(`Conversation message access: ${count} checks passed (isolated, no real database).`);
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
