'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { load } = require('./paymentTransactionHarness');

function harness({ event = {}, existingConversationId = null } = {}) {
  const calls = [];
  const transactionCalls = [];
  const eventRow = {
    id: 91,
    organizer_id: 8,
    title: 'Marché de nuit',
    status: 'published',
    allow_organizer_messages: true,
    ...event,
  };
  const service = load('services/messageConversationService.js', {
    path: {},
    fs: { promises: {} },
    './messagePresentation': {
      filterMessage: () => ({ blocked: false }),
      decodeStructuredMessage: () => ({ metadata: {} }),
      maskPhoneNumbers: (value) => value,
      mapConversationRow: (value) => value,
      mapMessageRow: (value, convId) => ({ ...value, conv_id: convId }),
    },
    './sellerInsightsService': { getSellerResponseTime: async () => null },
    '../config/database': {
      async query(sql, params) {
        calls.push({ sql: sql.replace(/\s+/g, ' ').trim(), params: Array.from(params) });
        return { rows: eventRow ? [eventRow] : [] };
      },
      async withTransaction(callback) {
        return callback({
          async query(sql, params) {
            const normalized = sql.replace(/\s+/g, ' ').trim();
            transactionCalls.push({ sql: normalized, params: Array.from(params) });
            if (normalized.startsWith('INSERT INTO conversations')) return { rows: [{ id: existingConversationId || 501 }] };
            if (normalized.startsWith('INSERT INTO messages')) {
              return { rows: [{ id: 701, sender_id: 7, type: 'text', content: params[2], created_at: new Date().toISOString() }] };
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
  async function check(label, fn) { await fn(); count += 1; console.log(`  OK ${label}`); }

  await check('creates a dedicated event conversation and initial message', async () => {
    const h = harness();
    const result = await h.service.startEventConversation(7, 91, 'Bonjour');
    assert.strictEqual(result.conversationId, 501);
    assert.strictEqual(result.sellerId, 8);
    assert.match(h.calls[0].sql, /event_date >= \(NOW\(\) AT TIME ZONE 'Pacific\/Noumea'\)::date/);
    const insert = h.transactionCalls.find((call) => call.sql.startsWith('INSERT INTO conversations'));
    assert.ok(insert);
    assert.match(insert.sql, /annonce_id, event_id/);
    assert.match(insert.sql, /'event_chat'/);
    assert.match(insert.sql, /ON CONFLICT \(event_id, buyer_id\)/);
    assert.deepStrictEqual(insert.params, [91, 7, 8]);
  });

  await check('reuses the visitor conversation for the same event', async () => {
    const h = harness({ existingConversationId: 333 });
    const result = await h.service.startEventConversation(7, 91, 'Une autre question');
    assert.strictEqual(result.conversationId, 333);
    assert.strictEqual(h.transactionCalls.filter((call) => call.sql.startsWith('INSERT INTO conversations')).length, 1);
    assert.strictEqual(h.transactionCalls.filter((call) => call.sql.startsWith('INSERT INTO messages')).length, 1);
  });

  await check('respects the organizer opt-in and prevents self-contact', async () => {
    await assert.rejects(
      () => harness({ event: { allow_organizer_messages: false } }).service.startEventConversation(7, 91, 'Bonjour'),
      (error) => error.status === 403,
    );
    await assert.rejects(
      () => harness().service.startEventConversation(8, 91, 'Bonjour'),
      (error) => error.status === 400,
    );
  });

  await check('migration and UI keep event chats separate from listings and troc', async () => {
    const root = path.resolve(__dirname, '..', '..', '..');
    const migration = fs.readFileSync(path.join(root, 'database', 'migrations', '20261120_event_organizer_messaging.sql'), 'utf8');
    const detail = fs.readFileSync(path.join(root, 'frontend', 'src', 'app', 'evenements', '[id]', 'page.tsx'), 'utf8');
    const rail = fs.readFileSync(path.join(root, 'frontend', 'src', 'components', 'messages', 'ConversationRail.tsx'), 'utf8');
    const messages = fs.readFileSync(path.join(root, 'frontend', 'src', 'components', 'messages', 'MessagesPageV2.tsx'), 'utf8');
    assert.match(migration, /ALTER COLUMN annonce_id DROP NOT NULL/);
    assert.match(migration, /event_id INTEGER REFERENCES events\(id\) ON DELETE CASCADE/);
    assert.match(migration, /conversation_type = 'event_chat'/);
    assert.match(detail, /Contacter l’organisateur/);
    assert.match(detail, /event_id: event\.id/);
    assert.match(rail, /conversation\.conversation_type === 'event_chat'/);
    assert.match(messages, /isBuyer=\{isBuyer && !eventConversation\}/);
    assert.match(messages, /\/evenements\/\$\{subjectId\}/);
  });

  console.log(`Event organizer messaging: ${count} checks passed (isolated, no real database).`);
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
