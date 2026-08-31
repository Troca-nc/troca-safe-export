'use strict';

const assert = require('assert');
const { load } = require('./paymentTransactionHarness');

function harness({ conversation = { buyer_id: 7, seller_id: 8, conversation_type: 'listing_chat' }, fail = false, offers = [{ id: 20, amount_xpf: 490 }] } = {}) {
  const calls = [];
  const forbidden = () => { throw new Error('Unexpected side effect'); };
  const service = load('services/messageConversationService.js', {
    path: {}, fs: { promises: {} },
    '../config/database': {
      withTransaction: forbidden,
      async query(sql, params) {
        const normalized = sql.replace(/\s+/g, ' ').trim();
        calls.push({ sql: normalized, params: Array.from(params) });
        assert.match(normalized, /JOIN conversations c ON c.id = o.conv_id/);
        assert.match(normalized, /WHERE o.conv_id = \$1 AND/);
        assert.match(normalized, /COALESCE\(c.conversation_type, 'listing_chat'\) = 'listing_chat' AND \(c.buyer_id = \$2 OR c.seller_id = \$2\)/);
        assert.match(normalized, /COALESCE\(c.conversation_type, 'listing_chat'\) <> 'listing_chat'/);
        assert.match(normalized, /jsonb_array_elements_text\(COALESCE\(c.metadata->'participant_ids', '\[\]'::jsonb\)\)/);
        assert.match(normalized, /participant_id.value::int = \$2/);
        assert.match(normalized, /ORDER BY o.id DESC$/);
        assert.strictEqual(params.length, 2);
        if (fail) throw new Error('Synthetic DB failure');
        const member = conversation && (
          conversation.buyer_id === params[1] || conversation.seller_id === params[1]
          || ((conversation.conversation_type ?? 'listing_chat') !== 'listing_chat'
            && (conversation.metadata?.participant_ids || []).map(Number).includes(params[1]))
        );
        return { rows: params[0] === 42 && member ? offers : [] };
      },
    },
    './messagePresentation': {}, './sellerInsightsService': {},
  });
  return { calls, service };
}

async function run() {
  let count = 0;
  async function check(label, fn) { await fn(); count++; console.log(`  OK ${label}`); }
  for (const userId of [7, 8]) {
    await check(`participant ${userId} can read offers`, async () => {
      const h = harness();
      assert.strictEqual((await h.service.listConversationOffersForUser(userId, '42'))[0].id, 20);
      assert.deepStrictEqual(h.calls[0].params, [42, userId]);
      assert.strictEqual(h.calls.length, 1);
    });
  }
  for (const settings of [{}, { conversation: null }, { offers: [] }]) {
    await check('inaccessible/missing/empty does not disclose offers', async () => {
      const h = harness(settings);
      assert.strictEqual((await h.service.listConversationOffersForUser(99, 42)).length, 0);
    });
  }
  await check('participant with no offers gets an empty result', async () => {
    const h = harness({ offers: [] });
    assert.strictEqual((await h.service.listConversationOffersForUser(7, 42)).length, 0);
  });
  for (const type of ['listing_chat', null, 'support']) {
    await check(`metadata participant respects conversation type ${type}`, async () => {
      const h = harness({ conversation: { buyer_id: 7, seller_id: 8, conversation_type: type, metadata: { participant_ids: [99] } } });
      const result = await h.service.listConversationOffersForUser(99, 42);
      assert.strictEqual(result.length, type === 'support' ? 1 : 0);
    });
  }
  await check('another conversation id does not return this conversation offers', async () => {
    assert.strictEqual((await harness().service.listConversationOffersForUser(7, 43)).length, 0);
  });
  for (const id of [0, -1, null, undefined, '', '42 OR 1=1', 1.5, [], Number.MAX_SAFE_INTEGER + 1]) {
    await check(`invalid conversation id ${String(id)} rejected before SQL`, async () => {
      const h = harness();
      await assert.rejects(h.service.listConversationOffersForUser(7, id), (err) => err.status === 400);
      assert.strictEqual(h.calls.length, 0);
    });
  }
  await check('absent identity rejected before SQL', async () => {
    const h = harness();
    await assert.rejects(h.service.listConversationOffersForUser(undefined, 42), (err) => err.status === 401);
    assert.strictEqual(h.calls.length, 0);
  });
  await check('DB failure propagates without a success response', async () => {
    await assert.rejects(harness({ fail: true }).service.listConversationOffersForUser(7, 42), /Synthetic DB failure/);
  });

  await check('real GET handler delegates authenticated identity and preserves response', async () => {
    const handlers = new Map();
    const middleware = [];
    const router = { use(fn) { middleware.push(fn); }, post() {}, get(path, fn) { handlers.set(path, fn); } };
    const schema = new Proxy(function () {}, { get: () => schema, apply: () => schema });
    const authenticate = () => {};
    let args;
    let failure = false;
    const forbidden = () => { throw new Error('Unexpected route effect'); };
    load('routes/offers.route.js', {
      express: { Router: () => router }, joi: schema,
      '../middleware/auth': { authenticate }, '../middleware/validate': { validate: () => forbidden },
      '../config/database': { query: forbidden, withTransaction: forbidden },
      '../services/websocketServer': {}, '../services/pushService': {},
      '../services/notificationService': {}, '../services/emailService': {},
      '../services/messageConversationService': {
        async listConversationOffersForUser(...values) {
          args = values;
          if (failure) throw new Error('Synthetic service error');
          return [];
        },
      },
    });
    assert.strictEqual(middleware[0], authenticate);
    const get = handlers.get('/conversations/:id/offers');
    let response;
    await get({ user: { id: 7 }, params: { id: '42' } }, { json(value) { response = value; } }, forbidden);
    assert.deepStrictEqual(args, [7, '42']);
    assert.strictEqual(response.data.length, 0);
    failure = true;
    let caught;
    await get({ user: { id: 7 }, params: { id: '42' } }, { json: forbidden }, (err) => { caught = err; });
    assert.strictEqual(caught.message, 'Synthetic service error');
  });
  console.log(`Conversation offers access: ${count} checks passed (isolated, no real database).`);
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
