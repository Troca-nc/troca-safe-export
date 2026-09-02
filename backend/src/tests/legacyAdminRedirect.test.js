'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');

describe('Legacy public-frontend admin surface', () => {
  it('redirige tout ancien chemin admin vers le back-office dédié', async () => {
    const config = require('../../../frontend/next.config.js');
    const redirects = await config.redirects();
    const rule = redirects.find(({ source }) => source === '/admin/:path*');
    assert.ok(rule);
    const expectedAdminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.kalico.nc';
    assert.strictEqual(rule.destination, `${expectedAdminUrl}/`);
    assert.strictEqual(rule.permanent, false);
  });
});
