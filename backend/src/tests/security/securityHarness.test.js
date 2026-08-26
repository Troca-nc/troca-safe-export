'use strict';

const assert = require('assert');
const path = require('path');
const { describe, it } = require('../helpers');
const seed = require('../../scripts/security/seedSecurityFixtures');
const inventory = require('../../scripts/security/inventoryPrivateAssets');
const canaries = require('../../scripts/security/verifyLogCanaries');

function withEnvironment(values, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe('security harness guards', () => {
  it('refuse le seed sans drapeau de sécurité explicite', () => {
    withEnvironment({ NODE_ENV: 'test', KALICO_SECURITY_TEST_ONLY: null, DB_NAME: 'kalico_security_test' }, () => {
      assert.throws(() => seed.assertSafeEnvironment(), /KALICO_SECURITY_TEST_ONLY/);
    });
  });

  it('refuse le seed sur une base qui ne finit pas par _security_test', () => {
    withEnvironment({ NODE_ENV: 'test', KALICO_SECURITY_TEST_ONLY: 'true', DB_NAME: 'kalico' }, () => {
      assert.throws(() => seed.assertSafeEnvironment(), /does not end with _security_test/);
    });
  });

  it('refuse l inventaire hors environnement de sécurité', () => {
    withEnvironment({ NODE_ENV: 'production', KALICO_SECURITY_TEST_ONLY: 'true', DB_NAME: 'kalico_security_test' }, () => {
      assert.throws(() => inventory.assertSafeEnvironment(), /explicit security-test environment/);
    });
  });

  it('classe uniquement les préfixes fermés', () => {
    assert.strictEqual(inventory.classify(path.join('chat', 'a', 'file.pdf')), 'chat');
    assert.strictEqual(inventory.classify(path.join('pro-documents', 'a', 'file.pdf')), 'pro-documents');
    assert.strictEqual(inventory.classify(path.join('unexpected', 'file.bin')), 'unknown');
  });

  it('refuse de rechercher une valeur qui n est pas un canari synthétique', () => {
    assert.throws(() => canaries.assertCanary('real-token'), /KALICO_CANARY_/);
    assert.strictEqual(canaries.assertCanary('KALICO_CANARY_QUERY_TEST_ONLY'), 'KALICO_CANARY_QUERY_TEST_ONLY');
  });

  it('n accepte que des fichiers explicitement fournis', () => {
    assert.throws(() => canaries.parseFiles([]), /At least one --file/);
    assert.deepStrictEqual(canaries.parseFiles(['--file', 'access.log']), ['access.log']);
  });
});
