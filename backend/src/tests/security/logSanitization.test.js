'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, makeRes } = require('../helpers');
const { sanitizeLogPath, MAX_LOG_PATH_LENGTH } = require('../../utils/logSanitizer');
const { internalAuth } = require('../../middleware/internalAuth');
const { sanitizeBody } = require('../../services/errorLogStore');

function withInternalToken(value, fn) {
  const previous = process.env.INTERNAL_API_TOKEN;
  process.env.INTERNAL_API_TOKEN = value;
  try {
    return fn();
  } finally {
    if (previous == null) delete process.env.INTERNAL_API_TOKEN;
    else process.env.INTERNAL_API_TOKEN = previous;
  }
}

describe('P0-B log and internal-token boundaries', () => {
  it('retire query et fragment des chemins journalisables', () => {
    assert.strictEqual(sanitizeLogPath('/api/health?token=KALICO_CANARY_QUERY_TEST_ONLY#x'), '/api/health');
    assert.strictEqual(sanitizeLogPath('https://kalico.nc/path?a=1'), '/path');
  });

  it('neutralise les contrôles et borne la longueur', () => {
    const result = sanitizeLogPath(`/safe\r\nforged?secret=x${'a'.repeat(3000)}`);
    assert.strictEqual(result, '/safeforged');
    assert.ok(result.length <= MAX_LOG_PATH_LENGTH);
  });

  it('refuse le token interne transmis en query', () => {
    withInternalToken('KALICO_CANARY_INTERNAL_HEADER_TEST_ONLY', () => {
      const req = { query: { token: 'KALICO_CANARY_INTERNAL_HEADER_TEST_ONLY' }, get: () => undefined };
      const res = makeRes();
      let passed = false;
      internalAuth(req, res, () => { passed = true; });
      assert.strictEqual(passed, false);
      assert.strictEqual(res._code, 403);
    });
  });

  it('accepte le token interne uniquement dans l en-tête dédié', () => {
    withInternalToken('KALICO_CANARY_INTERNAL_HEADER_TEST_ONLY', () => {
      const req = { query: {}, get: (name) => name === 'x-internal-token' ? 'KALICO_CANARY_INTERNAL_HEADER_TEST_ONLY' : undefined };
      const res = makeRes();
      let passed = false;
      internalAuth(req, res, () => { passed = true; });
      assert.strictEqual(passed, true);
    });
  });

  it('continue de masquer les valeurs sensibles dans les objets', () => {
    assert.deepStrictEqual(sanitizeBody({ token: 'KALICO_CANARY_BODY_TEST_ONLY', safe: 'ok' }), { token: '[redacted]', safe: 'ok' });
  });

  it('les formats Nginx n utilisent ni request brute ni referer', () => {
    const root = path.resolve(__dirname, '../../../../');
    for (const relative of ['nginx/nginx.conf', 'docker/security-test/nginx.conf']) {
      const content = fs.readFileSync(path.join(root, relative), 'utf8');
      assert.ok(content.includes('$request_method $uri $server_protocol'));
      assert.ok(!content.includes('"$request"'));
      assert.ok(!content.includes('$request_uri'));
      assert.ok(!content.includes('$http_referer'));
    }
  });
});
