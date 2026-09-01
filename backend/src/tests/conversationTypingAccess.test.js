'use strict';

const assert = require('assert');
const { load } = require('./paymentTransactionHarness');

function serviceHarness({ member = true } = {}) {
  const calls = [];
  const service = load('services/messageConversationService.js', {
    path: {}, fs: { promises: {} }, './messagePresentation': {}, './sellerInsightsService': {},
    '../config/database': {
      withTransaction() { throw new Error('Unexpected transaction'); },
      async query(sql, params) {
        const normalized = sql.replace(/\s+/g, ' ').trim();
        calls.push({ sql: normalized, params: Array.from(params) });
        assert.match(normalized, /SELECT c.id FROM conversations c WHERE c.id = \$1 AND/);
        assert.match(normalized, /c.buyer_id = \$2 OR c.seller_id = \$2/);
        assert.match(normalized, /participant_id.value::int = \$2/);
        assert.match(normalized, /LIMIT 1$/);
        return { rows: member ? [{ id: params[0] }] : [] };
      },
    },
  });
  return { service, calls };
}

function websocketHarness({ access = true } = {}) {
  let authMiddleware;
  let connectionHandler;
  const publications = [];
  const accessCalls = [];
  const forbidden = () => { throw new Error('Unexpected effect'); };
  class Server {
    use(fn) { authMiddleware = fn; }
    on(name, fn) { if (name === 'connection') connectionHandler = fn; }
  }
  const service = load('services/websocketServer.js', {
    '../config/jwt': { verifyAccessToken: () => ({ sub: 7 }) },
    '../config/database': { query: async () => ({ rows: [{ id: 7, prenom: 'Test', nom: 'User' }] }) },
    '../utils/logger': { logger: { info() {}, error() {} } },
    './observability': { recordWebsocket() {} },
    './messageConversationService': {
      async canAccessConversation(...args) { accessCalls.push(args); return access; },
      markConversationMessagesRead: forbidden,
    },
    './presenceService': { markUserOffline() {}, markUserOnline() {} },
    './websocketBridge': {
      async initWebsocketBridge() {}, shutdownWebsocketBridge() {},
      async publishConversationEvent(...args) { publications.push(args); },
      async publishUserEvent() {},
    },
    'socket.io': { Server },
  }, { process: { env: {} }, Date, setTimeout, clearTimeout });
  service.initSocket({});
  const handlers = new Map();
  const emissions = [];
  const socket = {
    id: 'socket-1', data: {}, rooms: new Set(['socket-1']),
    handshake: { auth: { token: 'synthetic' }, headers: {} },
    on(name, fn) { handlers.set(name, fn); },
    join(room) { this.rooms.add(room); }, leave(room) { this.rooms.delete(room); },
    emit(name, payload) { emissions.push([name, payload]); },
  };
  return { authMiddleware, connectionHandler, socket, handlers, emissions, publications, accessCalls };
}

async function run() {
  let count = 0;
  async function check(label, fn) { await fn(); count++; console.log(`  OK ${label}`); }
  await check('shared service allows a participant with one parameterized query', async () => {
    const h = serviceHarness();
    assert.strictEqual(await h.service.canAccessConversation(7, '42'), true);
    assert.deepStrictEqual(h.calls[0].params, [42, 7]);
    assert.strictEqual(h.calls.length, 1);
  });
  await check('shared service returns false for outsider', async () => {
    assert.strictEqual(await serviceHarness({ member: false }).service.canAccessConversation(99, 42), false);
  });
  for (const value of [null, undefined, 0, -1, '', 'x', 1.5, [], Number.MAX_SAFE_INTEGER + 1]) {
    await check(`invalid conversation id ${String(value)} avoids SQL`, async () => {
      const h = serviceHarness();
      assert.strictEqual(await h.service.canAccessConversation(7, value), false);
      assert.strictEqual(h.calls.length, 0);
    });
  }
  await check('authorized join normalizes room and permits typing publication', async () => {
    const h = websocketHarness();
    await h.authMiddleware(h.socket, (error) => assert.strictEqual(error, undefined));
    h.connectionHandler(h.socket);
    await h.handlers.get('join_conversation')('42');
    assert.deepStrictEqual(h.accessCalls, [[7, '42']]);
    assert.ok(h.socket.rooms.has('conv:42'));
    assert.strictEqual(h.emissions[0][0], 'joined_conversation');
    assert.strictEqual(h.emissions[0][1].convId, 42);
    await h.handlers.get('typing')({ convId: 42, isTyping: true });
    assert.strictEqual(h.publications.length, 1);
    assert.strictEqual(h.publications[0][0], 42);
    assert.strictEqual(h.publications[0][1], 'user_typing');
  });
  await check('unauthorized join cannot publish typing', async () => {
    const h = websocketHarness({ access: false });
    await h.authMiddleware(h.socket, () => {}); h.connectionHandler(h.socket);
    await h.handlers.get('join_conversation')(42);
    assert.strictEqual(h.emissions[0][0], 'error');
    assert.strictEqual(h.emissions[0][1].message, 'Conversation introuvable');
    await h.handlers.get('typing')({ convId: 42, isTyping: true });
    assert.strictEqual(h.publications.length, 0);
  });
  await check('direct typing without join is ignored', async () => {
    const h = websocketHarness();
    await h.authMiddleware(h.socket, () => {}); h.connectionHandler(h.socket);
    await h.handlers.get('typing')({ convId: 42, isTyping: true });
    assert.strictEqual(h.publications.length, 0);
    assert.strictEqual(h.accessCalls.length, 0);
  });
  for (const payload of [null, undefined, {}, { convId: 'x' }, { convId: -1 }]) {
    await check(`malformed typing ${String(payload)} is ignored`, async () => {
      const h = websocketHarness();
      await h.authMiddleware(h.socket, () => {}); h.connectionHandler(h.socket);
      await h.handlers.get('typing')(payload);
      assert.strictEqual(h.publications.length, 0);
    });
  }
  console.log(`Conversation typing access: ${count} checks passed (isolated socket and database).`);
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
