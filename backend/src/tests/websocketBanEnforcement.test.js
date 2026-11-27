'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { load } = require('./paymentTransactionHarness');

function harness({
  user = { id: 7, prenom: 'Test', nom: 'User', banned_until: null },
  token = 'valid',
  payload = { sub: 7 },
  blacklisted = false,
  queryError = false,
} = {}) {
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
    '../config/jwt': { verifyAccessToken(value) { if (value !== 'valid') { const error = new Error('bad token'); error.name = 'JsonWebTokenError'; throw error; } return payload; } },
    '../config/database': {
      async query(sql, params) {
        queries.push({ sql, params: Array.from(params) });
        assert.match(sql, /FROM users u/);
        assert.deepStrictEqual(Array.from(params), [7, payload.sid || null]);
        if (queryError) throw new Error('Synthetic DB failure');
        return { rows: user ? [user] : [] };
      },
    },
    './authAccountService': { isAccessTokenBlacklisted: async () => blacklisted },
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
  await check('blacklisted access token is rejected', async () => {
    const h = harness({ blacklisted: true });
    assert.strictEqual((await h.authenticate()).message, 'TOKEN_REVOKED');
    assert.strictEqual(h.queries.length, 0);
  });
  await check('revoked session family is rejected', async () => {
    const sid = '123e4567-e89b-12d3-a456-426614174000';
    const h = harness({
      payload: { sub: 7, sid },
      user: {
        id: 7,
        prenom: 'Test',
        nom: 'User',
        banned_until: null,
        auth_session_id: sid,
        auth_session_revoked_at: new Date().toISOString(),
        auth_session_expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
    });
    assert.strictEqual((await h.authenticate()).message, 'SESSION_REVOKED');
  });
  await check('database failure remains fail closed', async () => {
    const h = harness({ queryError: true });
    assert.strictEqual((await h.authenticate()).message, 'AUTH_UNAVAILABLE');
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
  await check('session logout disconnects only the matching session room', async () => {
    const h = harness();
    const sessionId = '123e4567-e89b-12d3-a456-426614174000';
    assert.strictEqual(h.service.disconnectSessionSockets(sessionId), true);
    assert.deepStrictEqual(h.disconnectedRooms, [[`session:${sessionId}`, true]]);
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
    const start = source.indexOf("router.patch('/users/:id/suspend'");
    const end = source.indexOf("router.patch('/users/:id/unsuspend'", start);
    const suspendRoute = source.slice(start, end);
    assert.ok(start >= 0 && end > start);
    assert.ok(suspendRoute.includes('await suspendUser(userId, duration_days)'));
    assert.ok(suspendRoute.indexOf('disconnectUserSockets(userId)') > suspendRoute.indexOf('await suspendUser'));
  });
  console.log(`WebSocket ban enforcement: ${count} checks passed (isolated handshake).`);
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
