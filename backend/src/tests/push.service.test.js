'use strict';

// ============================================================
//  Tests — pushService.js
// ============================================================

const assert = require('assert');
const { describe, it } = require('./helpers');

// ── Stub HTTPS (intercepte les requêtes Expo Push API) ────────
const httpsSentRequests = [];
require.cache[require.resolve('https')] = {
  id: require.resolve('https'), loaded: true,
  exports: {
    request: (_opts, callback) => {
      const body = { data: [{ status: 'ok' }] };
      const res = {
        on: (event, fn) => {
          if (event === 'data') fn(JSON.stringify(body));
          if (event === 'end') fn();
          return res;
        },
      };
      callback(res);
      return {
        on: () => {},
        write: (b) => httpsSentRequests.push(JSON.parse(b)),
        end: () => {},
      };
    },
  },
};

// ── Stub DB ───────────────────────────────────────────────────
let tokenRows = [];
let deletedTokens = [];
const dbStub = {
  query: async (sql, params) => {
    const s = sql.trim().toUpperCase();
    if (s.startsWith('SELECT') && s.includes('PUSH_TOKENS')) return { rows: tokenRows };
    if (s.startsWith('DELETE') && s.includes('PUSH_TOKENS')) {
      deletedTokens.push(params?.[0]);
      return { rows: [], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  },
};

const origLoad = require('module')._load;
require('module')._load = function (req, parent, isMain) {
  if (req.includes('config/database') || req.endsWith('database')) return dbStub;
  return origLoad.apply(this, arguments);
};

const { sendPushToUser, sendPushToUsers } = require('../services/pushService');
require('module')._load = origLoad;

describe('pushService — sendPushToUser', () => {
  it('ne fait rien si l\'utilisateur n\'a pas de token enregistré', async () => {
    httpsSentRequests.length = 0;
    tokenRows = [];
    await sendPushToUser(1, { title: 'Test', body: 'Hello' });
    assert.strictEqual(httpsSentRequests.length, 0);
  });

  it('envoie une requête push si un token existe', async () => {
    httpsSentRequests.length = 0;
    tokenRows = [{ token: 'ExponentPushToken[test123]' }];
    await sendPushToUser(1, { title: 'Nouveau message', body: 'Paul vous a écrit', data: { type: 'new_message' } });
    assert.strictEqual(httpsSentRequests.length, 1);
    const msg = httpsSentRequests[0][0];
    assert.strictEqual(msg.to, 'ExponentPushToken[test123]');
    assert.strictEqual(msg.title, 'Nouveau message');
    assert.strictEqual(msg.channelId, 'messages'); // canal messages pour new_message
  });

  it('utilise le canal "default" pour les autres types', async () => {
    httpsSentRequests.length = 0;
    tokenRows = [{ token: 'ExponentPushToken[abc]' }];
    await sendPushToUser(2, { title: 'Alerte', body: 'Nouvelle annonce', data: { type: 'alert' } });
    const msg = httpsSentRequests[0][0];
    assert.strictEqual(msg.channelId, 'default');
  });

  it('envoie à plusieurs tokens du même utilisateur', async () => {
    httpsSentRequests.length = 0;
    tokenRows = [
      { token: 'ExponentPushToken[ios1]' },
      { token: 'ExponentPushToken[android1]' },
    ];
    await sendPushToUser(3, { title: 'Multi', body: 'Test' });
    assert.strictEqual(httpsSentRequests.length, 1);
    assert.strictEqual(httpsSentRequests[0].length, 2);
  });
});

describe('pushService — sendPushToUsers', () => {
  it('envoie à plusieurs utilisateurs', async () => {
    httpsSentRequests.length = 0;
    tokenRows = [{ token: 'ExponentPushToken[user1]' }];
    await sendPushToUsers([1, 2, 3], { title: 'Broadcast', body: 'Hello all' });
    // 3 utilisateurs × 1 token chacun (même mock) = 3 requêtes
    assert.strictEqual(httpsSentRequests.length, 3);
  });
});
