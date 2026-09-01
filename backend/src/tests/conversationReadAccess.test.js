'use strict';

const assert = require('assert');
const { load } = require('./paymentTransactionHarness');

function harness({ conversation = { id: 42, buyer_id: 7, seller_id: 8, conversation_type: 'listing_chat' }, fail = false } = {}) {
  const rows = [
    { id: 1, conv_id: 42, sender_id: 8, read_at: null },
    { id: 2, conv_id: 42, sender_id: 7, read_at: null },
    { id: 3, conv_id: 42, sender_id: 8, read_at: 'already-read' },
    { id: 4, conv_id: 43, sender_id: 8, read_at: null },
  ];
  let calls = 0;
  const service = load('services/messageConversationService.js', {
    path: {}, fs: { promises: {} }, './messagePresentation': {}, './sellerInsightsService': {},
    '../config/database': {
      withTransaction() { throw new Error('Unexpected transaction'); },
      async query(sql, params) {
        calls++;
        const normalized = sql.replace(/\s+/g, ' ').trim();
        // Check the actual access predicates before simulating the UPDATE.
        assert.match(normalized, /UPDATE messages m SET read_at = NOW\(\)/);
        assert.match(normalized, /m.conv_id = \$1 AND m.sender_id != \$2 AND m.read_at IS NULL/);
        assert.match(normalized, /AND EXISTS \( SELECT 1 FROM conversations c WHERE c.id = m.conv_id AND/);
        assert.match(normalized, /COALESCE\(c.conversation_type, 'listing_chat'\) = 'listing_chat' AND \(c.buyer_id = \$2 OR c.seller_id = \$2\)/);
        assert.match(normalized, /COALESCE\(c.conversation_type, 'listing_chat'\) <> 'listing_chat'/);
        assert.match(normalized, /participant_id.value::int = \$2/);
        assert.match(normalized, /RETURNING m.id$/);
        assert.strictEqual(params.length, 2);
        if (fail) throw new Error('Synthetic database failure');
        const [convId, userId] = params.map(Number);
        const member = conversation && conversation.id === convId && (
          conversation.buyer_id === userId || conversation.seller_id === userId
          || ((conversation.conversation_type ?? 'listing_chat') !== 'listing_chat'
            && (conversation.metadata?.participant_ids || []).map(Number).includes(userId))
        );
        const changed = [];
        for (const row of rows) {
          if (member && row.conv_id === convId && row.sender_id !== userId && row.read_at === null) {
            row.read_at = 'new-read';
            changed.push({ id: row.id });
          }
        }
        return { rows: changed, rowCount: changed.length };
      },
    },
  });
  return { service, rows, calls: () => calls };
}

async function run() {
  let count = 0;
  async function check(label, fn) { await fn(); count++; console.log(`  OK ${label}`); }
  for (const userId of [7, 8]) {
    await check(`participant ${userId} marks only incoming unread messages`, async () => {
      const h = harness();
      assert.strictEqual(await h.service.markConversationMessagesRead(42, userId), 1);
      assert.strictEqual(h.rows.find(row => row.sender_id === userId && row.conv_id === 42).read_at, null);
      assert.strictEqual(h.rows[2].read_at, 'already-read');
      assert.strictEqual(h.rows[3].read_at, null);
      assert.strictEqual(h.calls(), 1);
    });
  }
  for (const conversation of [undefined, null]) {
    await check('outsider or missing conversation changes nothing', async () => {
      const h = harness({ conversation });
      const before = JSON.stringify(h.rows);
      assert.strictEqual(await h.service.markConversationMessagesRead(42, 99), 0);
      assert.strictEqual(JSON.stringify(h.rows), before);
    });
  }
  await check('different conversation cannot be marked using another membership', async () => {
    const h = harness();
    assert.strictEqual(await h.service.markConversationMessagesRead(43, 7), 0);
    assert.strictEqual(h.rows[3].read_at, null);
  });
  await check('repeated marking returns zero without rewriting timestamps', async () => {
    const h = harness();
    await h.service.markConversationMessagesRead(42, 7);
    const before = JSON.stringify(h.rows);
    assert.strictEqual(await h.service.markConversationMessagesRead(42, 7), 0);
    assert.strictEqual(JSON.stringify(h.rows), before);
  });
  for (const type of ['listing_chat', null, 'support']) {
    await check(`metadata participant follows shared access rule for ${type}`, async () => {
      const h = harness({ conversation: { id: 42, buyer_id: 7, seller_id: 8, conversation_type: type, metadata: { participant_ids: [99] } } });
      assert.strictEqual(await h.service.markConversationMessagesRead(42, 99), type === 'support' ? 2 : 0);
    });
  }
  await check('DB failure rejects without mutations', async () => {
    const h = harness({ fail: true });
    const before = JSON.stringify(h.rows);
    await assert.rejects(h.service.markConversationMessagesRead(42, 7), /Synthetic database failure/);
    assert.strictEqual(JSON.stringify(h.rows), before);
  });
  console.log(`Conversation read access: ${count} checks passed (simulated database).`);
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
