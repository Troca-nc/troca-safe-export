'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, makeRes } = require('../helpers');

const databasePath = require.resolve('../../config/database');
const middlewarePath = require.resolve('../../middleware/adminApiToken');
const originalDatabaseCache = require.cache[databasePath];
const originalMiddlewareCache = require.cache[middlewarePath];
const queryCalls = [];
let adminRow = null;

require.cache[databasePath] = {
  exports: {
    query: async (sql, params) => {
      queryCalls.push({ sql, params });
      return { rows: adminRow ? [adminRow] : [], rowCount: adminRow ? 1 : 0 };
    },
  },
};
delete require.cache[middlewarePath];

const { requireAdminToken, secureTokenEquals } = require('../../middleware/adminApiToken');

require.cache[databasePath] = originalDatabaseCache;
if (originalMiddlewareCache) require.cache[middlewarePath] = originalMiddlewareCache;
else delete require.cache[middlewarePath];

function resetState() {
  queryCalls.length = 0;
  adminRow = null;
}

async function withAdminEnv(values, fn) {
  const previous = {
    ADMIN_API_TOKEN: process.env.ADMIN_API_TOKEN,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  });
  try {
    await fn();
  } finally {
    Object.entries(previous).forEach(([key, value]) => {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    });
  }
}

describe('admin API token attribution', () => {
  it('compare le token sans égalité de chaînes directe', () => {
    assert.strictEqual(secureTokenEquals('secret-a', 'secret-a'), true);
    assert.strictEqual(secureTokenEquals('secret-a', 'secret-b'), false);
    assert.strictEqual(secureTokenEquals('', 'secret-a'), false);
  });

  it('échoue fermé si ADMIN_EMAIL est absent', async () => {
    resetState();
    await withAdminEnv({ ADMIN_API_TOKEN: 'shared-secret', ADMIN_EMAIL: null }, async () => {
      const req = { headers: { 'x-admin-token': 'shared-secret' } };
      const res = makeRes();
      let passed = false;

      await requireAdminToken(req, res, () => { passed = true; });

      assert.strictEqual(passed, false);
      assert.strictEqual(res._code, 503);
      assert.strictEqual(queryCalls.length, 0);
    });
  });

  it('attribue uniquement le compte admin configuré et ignore tout email forgé', async () => {
    resetState();
    adminRow = { id: 42, email: 'admin@kalico.nc', prenom: 'Admin', nom: 'Kalico', is_admin: true };
    await withAdminEnv({ ADMIN_API_TOKEN: 'shared-secret', ADMIN_EMAIL: 'admin@kalico.nc' }, async () => {
      const req = {
        headers: {
          'x-admin-token': 'shared-secret',
          'x-admin-email': 'attacker@example.test',
        },
      };
      const res = makeRes();
      let passed = false;

      await requireAdminToken(req, res, () => { passed = true; });

      assert.strictEqual(passed, true);
      assert.strictEqual(req.user.id, 42);
      assert.strictEqual(req.admin.email, 'admin@kalico.nc');
      assert.strictEqual(queryCalls.length, 1);
      assert.strictEqual(queryCalls[0].params[0], 'admin@kalico.nc');
      assert.ok(queryCalls[0].sql.includes('deleted_at IS NULL'));
    });
  });

  it('n interroge pas la base avec un token partagé invalide', async () => {
    resetState();
    await withAdminEnv({ ADMIN_API_TOKEN: 'shared-secret', ADMIN_EMAIL: 'admin@kalico.nc' }, async () => {
      const req = { headers: { 'x-admin-token': 'wrong-secret' } };
      const res = makeRes();

      await requireAdminToken(req, res, () => {});

      assert.strictEqual(res._code, 401);
      assert.strictEqual(queryCalls.length, 0);
    });
  });

  it('ne transmet plus x-admin-email depuis l application Admin', () => {
    const root = path.resolve(__dirname, '../../../../');
    const source = fs.readFileSync(path.join(root, 'admin/src/lib/backend.ts'), 'utf8');
    assert.ok(!source.toLowerCase().includes('x-admin-email'));
  });
});
