'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { load } = require('./paymentTransactionHarness');

function harness({ user = { id: 7, prenom: 'Test', nom: 'User', banned_until: null }, token = 'valid', queryError = false } = {}) {
  let authMiddleware;
  let connectionHandler;
  const online = [];
  const disconnectedRooms = [];
  const records = [];
  const queries = [];
  class Server {
    use(fn) { authMiddleware = fn; }
    on(name, fn) { if (name === 'connection') connectionHandler = fn; }
    in(room) { return { disconnectSockets(force) { disconnectedRooms.push([room, force]); } }; }
  }
  const forbidden = () => { throw new Error('Unexpected effect'); };
  const service = load('services/websocketServer.js', {
    '../config/jwt': { verifyAccessToken(value) { if (value !== 'valid') throw new Error('bad token'); return { sub: 7 }; } },
    '../config/database': {
      async query(sql, params) {
        queries.push({ sql, params: Array.from(params) });
        assert.match(sql, /SELECT id, prenom, nom, banned_until FROM users WHERE id = \$1 AND deleted_at IS NULL/);
        assert.deepStrictEqual(Array.from(params), [7]);
        if (queryError) throw new Error('Synthetic DB failure');
        return { rows: user ? [user] : [] };
      },
    },
    '../utils/logger': { logger: { info() {}, error() {} } },
    './observability': { recordWebsocket(...args) { records.push(args); } },
    './messageConversationService': { canAccessConversation: forbidden, markConversationMessagesRead: forbidden },
    './presenceService': { markUserOffline: forbidden, markUserOnline(id) { online.push(id); } },
    './websocketBridge': {
      async initWebsocketBridge() {}, async publishConversationEvent() {}, async publishUserEvent() {}, shutdownWebsocketBridge() {},
    },
    'socket.io': { Server },
  }, { process: { env: {} }, Date, setTimeout, clearTimeout });
  service.initSocket({});
  const socket = { handshake: { auth: { token }, headers: {} } };
  async function authenticate() {
    return new Promise((resolve) => authMiddleware(socket, (error) => resolve(error)));
  }
  return { authenticate, connectionHandler: () => connectionHandler, disconnectedRooms, online, queries, records, service, socket };
}

async function run() {
  let count = 0;
  async function check(label, fn) { await fn(); count++; console.log(`  OK ${label}`); }
  await check('active user authenticates and is marked online', async () => {
    const h = harness();
    assert.strictEqual(await h.authenticate(), undefined);
    assert.strictEqual(h.socket.userId, 7);
    assert.strictEqual(h.socket.userName, 'Test User');
    assert.deepStrictEqual(h.online, [7]);
    assert.strictEqual(h.queries.length, 1);
  });
  await check('past ban does not block authentication', async () => {
    const h = harness({ user: { id: 7, prenom: 'Test', nom: 'User', banned_until: new Date(Date.now() - 60000).toISOString() } });
    assert.strictEqual(await h.authenticate(), undefined);
    assert.deepStrictEqual(h.online, [7]);
  });
  for (const value of [new Date(Date.now() + 60000).toISOString(), new Date(Date.now() + 86400000)]) {
    await check('future ban rejects before online state', async () => {
      const h = harness({ user: { id: 7, prenom: 'Test', nom: 'User', banned_until: value } });
      const error = await h.authenticate();
      assert.strictEqual(error.message, 'USER_BANNED');
      assert.deepStrictEqual(h.online, []);
      assert.strictEqual(h.socket.userId, undefined);
    });
  }
  await check('missing or deleted user is rejected', async () => {
    const h = harness({ user: null });
    assert.strictEqual((await h.authenticate()).message, 'USER_NOT_FOUND');
    assert.deepStrictEqual(h.online, []);
  });
  await check('invalid token remains fail closed', async () => {
    const h = harness({ token: 'invalid' });
    assert.strictEqual((await h.authenticate()).message, 'AUTH_INVALID');
    assert.strictEqual(h.queries.length, 0);
    assert.deepStrictEqual(h.online, []);
  });
  await check('database failure remains fail closed', async () => {
    const h = harness({ queryError: true });
    assert.strictEqual((await h.authenticate()).message, 'AUTH_INVALID');
    assert.deepStrictEqual(h.online, []);
  });
  await check('missing token is rejected without database lookup', async () => {
    const h = harness({ token: null });
    assert.strictEqual((await h.authenticate()).message, 'AUTH_REQUIRED');
    assert.strictEqual(h.queries.length, 0);
  });
  await check('administrative ban can disconnect every active user socket', async () => {
    const h = harness();
    assert.strictEqual(h.service.disconnectUserSockets('7'), true);
    assert.deepStrictEqual(h.disconnectedRooms, [['user:7', true]]);
  });
  for (const id of [null, undefined, 0, -1, 'x', 1.5]) {
    await check(`invalid disconnect identity ${String(id)} is ignored`, async () => {
      const h = harness();
      assert.strictEqual(h.service.disconnectUserSockets(id), false);
      assert.deepStrictEqual(h.disconnectedRooms, []);
    });
  }
  await check('admin ban path disconnects sockets after persisting the ban', async () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'admin.routes.js'), 'utf8');
    const banCase = source.slice(source.indexOf("case 'ban':"), source.indexOf("case 'unban':"));
    assert.ok(banCase.includes('UPDATE users SET banned_until'));
    assert.ok(banCase.includes('UPDATE users SET deleted_at'));
    assert.ok(banCase.indexOf('disconnectUserSockets(id)') > banCase.lastIndexOf('UPDATE users SET'));
  });
  console.log(`WebSocket ban enforcement: ${count} checks passed (isolated handshake).`);
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
