'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

describe('Payment provider reference scope', () => {
  it('rend la référence unique à l intérieur de chaque fournisseur', () => {
    const migration = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'database', 'migrations', '20260909_scope_payment_references_by_provider.sql'),
      'utf8',
    );
    assert.ok(migration.includes('DROP CONSTRAINT IF EXISTS payments_provider_ref_key'));
    assert.ok(migration.includes('ON payments (provider, provider_ref)'));
  });

  it('borne les accès applicatifs à la référence par le fournisseur', () => {
    const root = path.join(__dirname, '..');
    const files = [
      'routes/payment.route.js',
      'services/bonPlansService.js',
      'services/demoSeedService.js',
      'services/paymentHelpers.js',
      'services/paymentWebhookService.js',
    ];
    const source = files.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
    assert.ok(!/ON CONFLICT \(provider_ref\)/.test(source));
    for (const line of source.split(/\r?\n/).filter((value) => value.includes('WHERE provider_ref = $'))) {
      assert.ok(line.includes('provider ='), `Référence fournisseur non bornée: ${line.trim()}`);
    }
  });
});
