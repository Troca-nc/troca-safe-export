'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const root = path.resolve(__dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Legacy admin unavailable contract', () => {
  it('ne redirige pas vers un domaine admin non confirmé', async () => {
    const config = require('../../../frontend/next.config.js');
    assert.ok(!(await config.redirects()).some((rule) => rule.source.startsWith('/admin')));
  });
  it('retire les quatre écrans simulés sans charger leurs hooks', () => {
    for (const page of ['dashboard', 'users', 'annonces', 'signalements']) {
      const source = read(`frontend/src/app/admin/${page}/page.tsx`);
      assert.ok(source.includes('return <LegacyAdminUnavailable />'));
      assert.ok(!source.includes('useAdmin'));
    }
    assert.ok(read('frontend/src/components/admin/LegacyAdminUnavailable.tsx').includes('Aucune action administrative'));
  });
  it('les anciennes mutations ne retournent plus de faux succès', () => {
    const source = read('frontend/src/hooks/useAdmin.ts');
    assert.ok(!source.includes('=> true'));
    assert.ok(!source.includes('success: true'));
    assert.ok(source.includes('success: false, message: UNAVAILABLE'));
    assert.ok(source.includes('error: UNAVAILABLE'));
  });
});
