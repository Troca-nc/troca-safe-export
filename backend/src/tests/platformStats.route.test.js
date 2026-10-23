'use strict';

const assert = require('assert');
const { describe, it, makeReq, makeRes } = require('./helpers');

const calls = [];
const databasePath = require.resolve('../config/database');
const cachePath = require.resolve('../services/sharedCache');
const authPath = require.resolve('../middleware/auth');
const routePath = require.resolve('../routes/stats.route');

const originals = new Map([
  [databasePath, require.cache[databasePath]],
  [cachePath, require.cache[cachePath]],
  [authPath, require.cache[authPath]],
  [routePath, require.cache[routePath]],
]);

require.cache[databasePath] = {
  id: databasePath,
  filename: databasePath,
  loaded: true,
  exports: {
    query: async (sql) => {
      calls.push(sql);
      if (sql.includes('FROM users')) return { rows: [{ count: 7 }] };
      if (sql.includes('FROM annonces')) return { rows: [{ count: 2 }] };
      if (sql.includes('FROM bon_plans')) return { rows: [{ count: 3 }] };
      if (sql.includes('FROM covoiturages')) return { rows: [{ count: 4 }] };
      throw new Error(`Requête inattendue: ${sql}`);
    },
  },
};
require.cache[cachePath] = {
  id: cachePath,
  filename: cachePath,
  loaded: true,
  exports: {
    deletePrefix: async () => {},
    getJson: async () => null,
    setJson: async () => {},
  },
};
require.cache[authPath] = {
  id: authPath,
  filename: authPath,
  loaded: true,
  exports: { authenticate: (_req, _res, next) => next() },
};
delete require.cache[routePath];

const router = require('../routes/stats.route');

for (const [path, cached] of originals) {
  if (cached) require.cache[path] = cached;
  else delete require.cache[path];
}

describe('GET /api/stats/platform', () => {
  it('retourne uniquement les comptes existants et les annonces actives non supprimées', async () => {
    const layer = router.stack.find((item) => item.route?.path === '/platform');
    const handler = layer?.route?.stack?.[0]?.handle;
    assert.strictEqual(typeof handler, 'function');

    const req = makeReq();
    const res = makeRes();
    await handler(req, res);

    assert.deepStrictEqual(res._payload, {
      members_count: 7,
      listings_count: 2,
      bons_plans_count: 3,
      rides_count: 4,
    });

    const membersSql = calls.find((sql) => sql.includes('FROM users'));
    const listingsSql = calls.find((sql) => sql.includes('FROM annonces'));
    assert.match(membersSql, /deleted_at IS NULL/);
    assert.match(listingsSql, /status = 'active'/);
    assert.match(listingsSql, /deleted_at IS NULL/);
  });
});

